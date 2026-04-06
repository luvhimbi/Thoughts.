import Swal from 'sweetalert2';
import { authService } from '../services/authService';
import { journalService } from '../services/journalService';

/**
 * Custom Styled SweetAlert2 for Thoughts App
 */
const ThoughtsSwal = Swal.mixin({
  customClass: {
    container: 'thoughts-swal-container',
    popup: 'thoughts-swal-popup',
    title: 'thoughts-swal-title thoughts-brand thoughts-brand--md',
    htmlContainer: 'thoughts-swal-text',
    confirmButton: 'btn-minimal px-4 py-2 mx-2',
    cancelButton: 'btn-minimal-outline px-4 py-2 mx-2',
    actions: 'thoughts-swal-actions'
  },
  buttonsStyling: false,
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  backdrop: `rgba(0,0,0,0.4)`
});

/**
 * confirmLogout — reusable logout confirmation
 * @param {Function} navigate — double check navigation
 */
export const confirmLogout = async (navigate) => {
  const result = await ThoughtsSwal.fire({
    title: 'Leaving your quiet space?',
    text: "Your thoughts are safe, but you'll need to sign back in to see them.",
    icon: 'question',
    iconColor: 'var(--text-secondary)',
    showCancelButton: true,
    confirmButtonText: 'Logout',
    cancelButtonText: 'Stay',
    reverseButtons: true
  });

  if (result.isConfirmed) {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
      ThoughtsSwal.fire({
        title: 'Error',
        text: 'Logout failed. Please try again.',
        icon: 'error'
      });
    }
  }
};

/**
 * confirmDeleteData — clear all thoughts from Firestore
 */
export const confirmDeleteData = async (userId) => {
  const result = await ThoughtsSwal.fire({
    title: 'Wipe your slate clean?',
    text: "This will permanently delete every entry you've ever written. This action cannot be reversed.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, clear everything',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#d33',
    reverseButtons: true
  });

  if (result.isConfirmed) {
    try {
      await journalService.deleteAllEntries(userId);
      ThoughtsSwal.fire('Cleared', 'Your journal is now empty.', 'success');
      return true;
    } catch (error) {
      ThoughtsSwal.fire('Error', 'Failed to delete entries. Please try again.', 'error');
      return false;
    }
  }
  return false;
};

/**
 * confirmDeleteAccount — delete user account and data
 */
export const confirmDeleteAccount = async (userId, navigate) => {
  const result = await ThoughtsSwal.fire({
    title: 'Are you sure?',
    html: "<p>Deleting your account is permanent. All your thoughts will be lost forever.</p><p class='small text-danger mt-3'>Please type <strong>DELETE</strong> to confirm.</p>",
    input: 'text',
    inputPlaceholder: 'DELETE',
    showCancelButton: true,
    confirmButtonText: 'Delete My Account',
    cancelButtonText: 'Stay',
    confirmButtonColor: '#d33',
    reverseButtons: true,
    inputValidator: (value) => {
      if (value !== 'DELETE') {
        return 'You must type DELETE to confirm';
      }
    }
  });

  if (result.isConfirmed) {
    try {
      // 1. Delete all entries
      await journalService.deleteAllEntries(userId);
      // 2. Delete the account
      await authService.deleteAccount();
      
      ThoughtsSwal.fire({
        title: 'Goodbye',
        text: 'Your account and data have been deleted.',
        icon: 'success'
      });
      navigate('/');
    } catch (error) {
      console.error("Account deletion failed:", error);
      if (error.code === 'auth/requires-recent-login') {
        ThoughtsSwal.fire('Action Required', 'Please logout and sign in again to perform this sensitive action.', 'info');
      } else {
        ThoughtsSwal.fire('Error', 'Account deletion failed. Please contact support.', 'error');
      }
    }
  }
};
