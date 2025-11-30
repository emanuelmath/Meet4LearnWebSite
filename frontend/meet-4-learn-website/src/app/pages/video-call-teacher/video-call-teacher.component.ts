import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { CourseService } from '../../services/course.service';
import { SupabaseService } from '../../services/supabase.service'; 
import { RealtimeChannel } from '@supabase/supabase-js';
import { ProfileService } from '../../services/profile.service'; 
@Component({
  selector: 'app-video-call-teacher',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './video-call-teacher.component.html',
  styleUrl: './video-call-teacher.component.css'
})
export class VideoCallTeacherComponent implements OnInit, OnDestroy {

  public messages: Signal<ChatMessage[]>;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private chatService: ChatService,
    private courseService: CourseService,
    private supabase: SupabaseService,
    private profileService: ProfileService
  ) {
    this.messages = this.chatService.currentMessages;
  }

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;

  moduleId!: number;
  courseIdToReturn!: number;
  courseName = signal<string>('Cargando...'); 
  
  isMicOn = signal(true);
  isCamOn = signal(true);
  isScreenSharing = signal(false);
  
  activePanel = signal<'chat' | 'participants' | null>(null);

  newMessageText = signal('');
  localStream: MediaStream | null = null;
  cameraStream: MediaStream | null = null; 

  presenceChannel: RealtimeChannel | null = null;
  participants = signal<any[]>([]);
  
  isProcessingHangup = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('moduleId');
    if (!id) { this.exit('URL inválida'); return; }
    
    this.moduleId = +id;

    try {
      const isOwner = await this.courseService.verifyModuleOwnership(this.moduleId);
      console.log(`valor de ${isOwner}`);
      if (!isOwner) {
        this.exit('Acceso denegado. No eres el propietario.');
        return;
      }

      const details = await this.courseService.getModuleDetails(this.moduleId);
      if (!details) { this.exit('Error cargando módulo.'); return; }
      
      this.courseIdToReturn = details.courseId;
      this.courseName.set(details.title);

      if (details.status === 'finalizado') {
        this.exit('Esta clase ya finalizó.', true);
        return;
      }

      this.chatService.loadMessages(this.moduleId);
      this.chatService.subscribeToChat(this.moduleId);
      await this.startCamera();
      this.initPresence();

    } catch (error) {
      console.error(error);
      this.exit('Error inesperado.');
    }
  }

  ngOnDestroy() {
    this.chatService.unsubscribe();
    if (this.presenceChannel) this.supabase.client.removeChannel(this.presenceChannel);
    this.stopAllTracks();
  }

  private exit(msg: string, toCourse = false) {
    alert(msg);
    if (toCourse && this.courseIdToReturn) this.router.navigate(['/panel-teacher/course', this.courseIdToReturn]);
    else this.router.navigate(['/panel-teacher/courses']);
  }

  async initPresence() {
    try {
      const myProfile = await this.profileService.getOwnProfile();
      const displayName = myProfile?.full_name || 'Docente';
      const myId = myProfile?.id;

      this.presenceChannel = this.supabase.client.channel(`room-${this.moduleId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = this.presenceChannel?.presenceState();
          const users: any[] = [];
          for (const key in state) users.push(...state[key]);
          this.participants.set(users);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await this.presenceChannel?.track({
              online_at: new Date().toISOString(),
              user_id: myId, 
              name: `${displayName} (Tú)`, 
              role: 'teacher'
            });
          }
        });
    } catch (e) { console.error(e); }
  }

  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localStream = stream;
      this.cameraStream = stream;
      this.attachStream(stream);
      this.isCamOn.set(true);
      this.isScreenSharing.set(false);
    } catch (err) {
      console.error(err);
      alert('No se pudo acceder a cámara/micrófono.');
    }
  }

  async toggleScreenShare() {
    if (this.isScreenSharing()) {
      await this.startCamera();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      stream.getVideoTracks()[0].onended = () => this.startCamera();
      this.localStream = stream;
      this.attachStream(stream);
      this.isScreenSharing.set(true);
      this.isCamOn.set(true);
    } catch (err) { console.error('Cancelado compartir'); }
  }

  attachStream(stream: MediaStream) {
    if (this.localVideo?.nativeElement) {
      this.localVideo.nativeElement.srcObject = stream;
      this.localVideo.nativeElement.muted = true;
    }
  }

  stopAllTracks() {
    this.localStream?.getTracks().forEach(t => t.stop());
    this.cameraStream?.getTracks().forEach(t => t.stop());
  }

  toggleMic() {
    if (this.localStream) {
      const track = this.localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        this.isMicOn.set(track.enabled);
      }
    }
  }

  toggleCam() {
    if (this.localStream) {
      const track = this.localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        this.isCamOn.set(track.enabled);
      }
    }
  }

  togglePanel(panel: 'chat' | 'participants') {
    this.activePanel.update( current => current === panel ? null : panel );
  }

  sendMessage() {
    const text = this.newMessageText().trim();
    if (!text) return;
    this.chatService.sendMessage(this.moduleId, text);
    this.newMessageText.set('');
  }

  async hangUp() {
    if (this.isProcessingHangup()) return;
    if (confirm('¿Finalizar la clase y cerrar la sala?')) {
      this.isProcessingHangup.set(true);
      this.stopAllTracks();
      await this.courseService.markModuleAsFinished(this.moduleId);
      this.router.navigate(['/panel-teacher/course', this.courseIdToReturn]);
    }
  }
}