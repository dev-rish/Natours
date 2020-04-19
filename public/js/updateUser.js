/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const updateData = async data => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/updateMe',
      data
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Data updated successfully!');
    }
  } catch (err) {
    showAlert('error', err.response.data.message + '!');
  }
};

export const updatePassword = async (
  oldPassword,
  newPassword,
  newPasswordConfirm
) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/updateMyPassword',
      data: {
        oldPassword,
        newPassword,
        newPasswordConfirm
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Password updated successfully!');
    }
  } catch (err) {
    showAlert('error', err.response.data.message + '!');
  }
};
