/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe('pk_test_VornsSEdSHlG4OeU9Ujd7SRx00NMqtZs6D');

const bookTour = async tourId => {
  try {
    // Get the session
    const { data } = await axios.get(
      `http://localhost:3000/api/v1/booking/checkout-session/${tourId}`
    );

    // Create checkout form + deduct amount
    await stripe.redirectToCheckout({
      sessionId: data.session.id
    });

  } catch (err) {
    if (err.response) {
      showAlert('error', err.response.data.message + '!');
    } else {
      showAlert('error', err.message + '!');
    }
  }
};

module.exports = { bookTour };
