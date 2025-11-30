import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { CourseService } from '../../services/course.service';
import { SupabaseService } from '../../services/supabase.service'; 
import { RealtimeChannel } from '@supabase/supabase-js';
import { ProfileService } from '../../services/profile.service'; 
import { 
  Room, 
  RoomEvent, 
  LocalVideoTrack, 
  RemoteParticipant, 
  LocalParticipant,
  Track 
} from 'livekit-client';
@Component({
  selector: 'app-video-call-teacher',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './video-call-teacher.component.html',
  styleUrl: './video-call-teacher.component.css'
})
export class VideoCallTeacherComponent implements OnInit, OnDestroy {

  // Exponemos mensajes para el HTML
  public messages: Signal<ChatMessage[]>;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private chatService: ChatService,
    private courseService: CourseService,
    private profileService: ProfileService
  ) {
    this.messages = this.chatService.currentMessages;
  }

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;

  room: Room | undefined;

  moduleId!: number;
  courseIdToReturn!: number;
  courseName = signal<string>('Conectando...'); 
  
  isMicOn = signal(true);
  isCamOn = signal(true);
  isScreenSharing = signal(false);
  
  activePanel = signal<'chat' | 'participants' | null>(null);

  newMessageText = signal('');
  
  participants = signal<any[]>([]);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('moduleId');
    if (!id) { this.exit('URL inválida'); return; }
    
    this.moduleId = +id;

    try {
      const isOwner = await this.courseService.verifyModuleOwnership(this.moduleId);
      if (!isOwner) {
        this.exit('Acceso denegado. No eres el propietario de esta clase.');
        return;
      }

      const details = await this.courseService.getModuleDetails(this.moduleId);
      if (!details) { this.exit('Error cargando módulo.'); return; }
      
      this.courseIdToReturn = details.courseId;
      this.courseName.set(details.title);

      if (details.status === 'finalizado') {
        this.exit('Esta clase ya ha finalizado.', true);
        return;
      }

      this.chatService.loadMessages(this.moduleId);
      this.chatService.subscribeToChat(this.moduleId);

      await this.connectToLiveKit();

    } catch (error) {
      console.error(error);
      this.exit('Error inesperado al iniciar la clase.');
    }
  }

  async connectToLiveKit() {
    try {
      const profile = await this.profileService.getOwnProfile();
      const myName = profile?.full_name || 'Profesor';

      const token = await this.courseService.getLiveKitToken(`class-${this.moduleId}`, myName);

      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720 }, // HD
        }
      });

      this.room
        .on(RoomEvent.Connected, () => {
            console.log('Conectado a LiveKit.');
            this.updateParticipants();
        })
        .on(RoomEvent.Disconnected, () => console.log('Desconectado.'))
        .on(RoomEvent.ParticipantConnected, () => this.updateParticipants())
        .on(RoomEvent.ParticipantDisconnected, () => this.updateParticipants());

      const liveKitUrl = 'wss://meet4learn-d3h5oi4q.livekit.cloud'; 
      await this.room.connect(liveKitUrl, token);

      await this.room.localParticipant.enableCameraAndMicrophone();
      
      this.attachLocalVideo();
      this.updateParticipants();

    } catch (error) {
      console.error('Error LiveKit:', error);
      alert('No se pudo conectar al servidor de video.');
    }
  }

  attachLocalVideo() {
    if (!this.room?.localParticipant) return;

    const publications = Array.from(this.room.localParticipant.videoTrackPublications.values());
    
    const videoPub = publications[0];

    const videoTrack = videoPub?.track; 

    if (videoTrack instanceof LocalVideoTrack && this.localVideo?.nativeElement) {
      videoTrack.attach(this.localVideo.nativeElement);
      this.localVideo.nativeElement.muted = true; 
    }
  }

  updateParticipants() {
    if (!this.room) return;
    
    // Remotos
    const remotes = Array.from(this.room.remoteParticipants.values()).map(p => ({
        identity: p.identity,
        sid: p.sid,
        isLocal: false
    }));

    const local = {
        identity: this.room.localParticipant.identity + ' (Tú)',
        sid: this.room.localParticipant.sid,
        isLocal: true
    };

    this.participants.set([local, ...remotes]);
  }

  async toggleMic() {
    if (this.room?.localParticipant) {
      const current = this.isMicOn();
      await this.room.localParticipant.setMicrophoneEnabled(!current);
      this.isMicOn.set(!current);
    }
  }

  async toggleCam() {
    if (this.room?.localParticipant) {
      const current = this.isCamOn();
      await this.room.localParticipant.setCameraEnabled(!current);
      this.isCamOn.set(!current);
      if (!current) setTimeout(() => this.attachLocalVideo(), 200);
    }
  }

  async toggleScreenShare() {
    if (this.room?.localParticipant) {
      try {
        const current = this.isScreenSharing();
        await this.room.localParticipant.setScreenShareEnabled(!current);
        this.isScreenSharing.set(!current);
        
        setTimeout(() => this.attachLocalVideo(), 500);
      } catch(e) {
        console.error('Error al compartir pantalla', e);
        this.isScreenSharing.set(false);
      }
    }
  }

  togglePanel(panel: 'chat' | 'participants') {
    this.activePanel.update(c => c === panel ? null : panel);
  }

  async hangUp() {
    if (confirm('¿Finalizar la clase para todos? Esto cerrará la sesión.')) {
      try {
        await this.room?.disconnect();
        
        await this.courseService.markModuleAsFinished(this.moduleId);
        
        this.router.navigate(['/panel-teacher/course', this.courseIdToReturn]);
      } catch (e) {
        console.error('Error al finalizar:', e);
        this.router.navigate(['/panel-teacher/courses']);
      }
    }
  }

  sendMessage() {
    const text = this.newMessageText().trim();
    if (!text) return;
    this.chatService.sendMessage(this.moduleId, text);
    this.newMessageText.set(''); 
  }

  private exit(msg: string, toCourse = false) {
    alert(msg);
    if (toCourse && this.courseIdToReturn) this.router.navigate(['/panel-teacher/course', this.courseIdToReturn]);
    else this.router.navigate(['/panel-teacher/courses']);
  }

  ngOnDestroy() {
    this.chatService.unsubscribe();
    this.room?.disconnect();
  }
}