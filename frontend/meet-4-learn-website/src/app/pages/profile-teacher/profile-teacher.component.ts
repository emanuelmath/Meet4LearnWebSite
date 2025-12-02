import { Component, signal, effect, computed, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService, Profile } from '../../services/profile.service';
import { PaymentService, SavedPaymentMethod } from '../../services/payment.service';

@Component({
  selector: 'app-profile-teacher',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-teacher.component.html',
  styleUrl: './profile-teacher.component.css'
})
export class ProfileTeacherComponent {

  constructor(
    private router: Router,
    private profileService: ProfileService,
    private authService: AuthService,
    private paymentService: PaymentService
  ) {
    effect(async () => {
      const user = this.authService.currentUser();
      if (user) await this.loadData();
    });
  }

  myProfile = signal<Profile | null>(null);
  myEmail = signal<String | null>(null);
  savedCards = signal<SavedPaymentMethod[]>([]);
  activePlanName = signal('Gratuito');

  rechargeForm = signal({
    amount: null as number | null,
    cardId: 0
  });

  simulatedCardForm = model({
    fullName: '',
    cardNumber: '',
    cvv: '',
    brand: 'Visa',
    expiration_month: 1,
    expiration_year: new Date().getFullYear() + 1
  });

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  modalErrorMessage = signal<string | null>(null);

  isLoading = signal(false);
  isAddCardModalOpen = signal(false);


  formattedCardNumber = computed(() => {
    const raw = this.simulatedCardForm().cardNumber
      ?.replace(/\D/g, '')
      .slice(0, 16);

    if (!raw) return '#### #### #### ####';
    return raw.replace(/(.{4})/g, '$1 ').trim();
  });


  async loadData() {
    this.isLoading.set(true);

    try {
      const email = this.authService.currentUser()!.email;
      const profile = await this.profileService.getOwnProfile();
      this.myProfile.set(profile);
      this.myEmail.set(email!);

      await this.loadSubscription();

      const cards = await this.paymentService.getMyPaymentMethods();
      this.savedCards.set(cards);

      if (cards.length > 0)
        this.rechargeForm.update(r => ({ ...r, cardId: cards[0].id }));

    } catch (err) {
      this.errorMessage.set('Error cargando datos.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadSubscription() {
    try {
      const sub: any = await this.profileService.getMySubscription();
      this.activePlanName.set(sub?.plan?.name ?? 'Gratuito');
    } catch {
      this.activePlanName.set('Gratuito');
    }
  }


  async handleQuickRecharge() {
    this.clearMessages();
    const { amount, cardId } = this.rechargeForm();

    if (!amount || amount <= 0) {
      this.errorMessage.set('Ingresa un monto válido.');
      return;
    }
    if (!cardId) {
      this.errorMessage.set('Selecciona una tarjeta.');
      return;
    }

    try {
      this.isLoading.set(true);

      await this.paymentService.rechargeBalance(amount, cardId);

      this.successMessage.set(`¡Recarga de $${amount} exitosa!`);
      this.rechargeForm.update(r => ({ ...r, amount: null }));

      await this.loadData();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error en la recarga.');
    } finally {
      this.isLoading.set(false);
    }
  }


  toggleAddCardModal() {
    this.isAddCardModalOpen.update(v => !v);
    this.modalErrorMessage.set(null);

    this.simulatedCardForm.set({
      fullName: '',
      cardNumber: '',
      cvv: '',
      brand: 'Visa',
      expiration_month: 1,
      expiration_year: new Date().getFullYear() + 1
    });
  }

  onCardNumberInput(value: string) {
    this.simulatedCardForm().cardNumber =
      value.replace(/\D/g, '').slice(0, 16);
  }

  async saveNewCard() {
    this.modalErrorMessage.set(null);

    const form = this.simulatedCardForm();
    const clean = form.cardNumber.replace(/\D/g, '');

    if (!form.fullName) {
      this.modalErrorMessage.set('El nombre es obligatorio.');
      return;
    }
    if (clean.length < 13) {
      this.modalErrorMessage.set('Número de tarjeta inválido.');
      return;
    }
    if (!form.cvv || form.cvv.length < 3) {
      this.modalErrorMessage.set('CVV inválido.');
      return;
    }

    const lastFour = clean.slice(-4);

    try {
      this.isLoading.set(true);

      await this.paymentService.addPaymentMethod({
        last_four_digits: lastFour,
        brand: form.brand,
        expiration_month: form.expiration_month,
        expiration_year: form.expiration_year
      });

      this.successMessage.set('Tarjeta agregada.');
      this.toggleAddCardModal();
      await this.loadData();

    } catch (err: any) {
      this.modalErrorMessage.set(err.message || 'Error al guardar tarjeta.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteCard(id: number) {
    if (!confirm('¿Eliminar tarjeta?')) return;

    try {
      this.isLoading.set(true);
      await this.paymentService.deletePaymentMethod(id);

      this.successMessage.set('Tarjeta eliminada.');
      await this.loadData();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'No se pudo eliminar.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleLogout() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }


  private clearMessages() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
