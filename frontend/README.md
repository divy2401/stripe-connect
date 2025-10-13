# Stripe Connect Frontend (React + Vite)

React frontend for Stripe Connect Custom Connected Accounts demo.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 📝 Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🏗️ Project Structure

```
src/
├── api/
│   └── client.ts           # API client with Axios + TypeScript types
├── components/
│   └── CheckoutForm.tsx    # Stripe Elements checkout form
├── pages/
│   ├── HomePage.tsx        # Business list and overview
│   ├── OnboardBusiness.tsx # Business creation form
│   └── PaymentPage.tsx     # Payment flow
├── config.ts               # Environment configuration
├── App.tsx                 # Router setup
├── main.tsx                # App entry point
└── index.css               # Global styles (Tailwind)
```

## 🎨 Pages

### Home Page (`/`)

- Displays all connected businesses
- Shows business status (active/pending)
- Quick actions to onboard or pay
- Educational content about the platform

### Onboard Business (`/onboard`)

- Form to create new business
- Automatically creates Stripe Custom Connected Account
- Shows success message with account details
- Quick navigation to make payment

### Payment Page (`/payment`)

- Select business from dropdown
- Enter payment amount
- Shows fee breakdown (platform fee vs business amount)
- Stripe Elements payment form
- Payment confirmation

## 🛠️ Commands

```bash
# Development
npm run dev           # Start dev server with hot reload

# Build
npm run build         # Build for production
npm run preview       # Preview production build

# Code Quality
npm run lint          # Lint code with ESLint
```

## 📦 Key Dependencies

**React Ecosystem:**

- `react` - UI library
- `react-dom` - React DOM renderer
- `react-router-dom` - Client-side routing

**Data Fetching:**

- `@tanstack/react-query` - Server state management
- `axios` - HTTP client

**Stripe:**

- `@stripe/stripe-js` - Stripe.js loader
- `@stripe/react-stripe-js` - React components for Stripe

**Styling:**

- `tailwindcss` - Utility-first CSS framework

## 🎯 Features

### API Integration (React Query)

```typescript
// Fetch businesses
const { data: businesses } = useQuery({
  queryKey: ["businesses"],
  queryFn: businessApi.getAllBusinesses,
});

// Create business
const createMutation = useMutation({
  mutationFn: businessApi.createBusiness,
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ["businesses"] });
  },
});
```

### Stripe Elements Integration

```typescript
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)

// Wrap checkout form with Elements provider
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <CheckoutForm />
</Elements>
```

## 🎨 Styling

This project uses **Tailwind CSS** for styling.

### Customization

Edit `tailwind.config.js` to customize theme:

```js
export default {
  theme: {
    extend: {
      colors: {
        primary: "#667eea",
        secondary: "#764ba2",
      },
    },
  },
};
```

### Gradient Background

The app features a beautiful gradient background defined in `index.css`:

```css
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 🧪 Testing Payments

Use Stripe test cards:

| Card Number         | Result             |
| ------------------- | ------------------ |
| 4242 4242 4242 4242 | Success            |
| 4000 0000 0000 0002 | Card declined      |
| 4000 0000 0000 9995 | Insufficient funds |

- Use any future expiry date
- Use any 3-digit CVC

## 🔒 Security

- API base URL configurable via environment variable
- Stripe publishable key (not secret) used on frontend
- All sensitive operations handled by backend
- CORS enabled on backend for this origin

## 📱 Responsive Design

The UI is fully responsive and works on:

- 📱 Mobile phones
- 💻 Tablets
- 🖥️ Desktops

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Environment Variables

Set these in your hosting provider:

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Recommended Hosting

- **Vercel** - Zero-config deployment for Vite
- **Netlify** - Automatic builds from Git
- **AWS Amplify** - Full-stack hosting
- **GitHub Pages** - Free static hosting

## 🎨 UI/UX Features

- ✅ Modern gradient design
- ✅ Responsive navigation
- ✅ Loading states with spinners
- ✅ Error handling with user-friendly messages
- ✅ Success confirmations
- ✅ Smooth transitions
- ✅ Accessible forms
- ✅ Clear call-to-actions

## 🔄 State Management

**React Query** handles all server state:

- Automatic caching
- Background refetching
- Optimistic updates
- Error handling
- Loading states

## 📖 Learn More

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [TanStack Query](https://tanstack.com/query)
- [Stripe Elements](https://stripe.com/docs/stripe-js/react)
- [Tailwind CSS](https://tailwindcss.com)
