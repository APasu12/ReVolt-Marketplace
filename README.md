# ReVolt-Marketplace - Battery Trading Platform

A comprehensive React-based marketplace application for trading and managing battery assets with advanced analytics and user management features.

## 🚀 Features

- **User Authentication**: Secure login and registration system
- **Battery Management**: Track and manage battery inventory
- **Marketplace**: Buy and sell batteries with offers and listings
- **Analytics Dashboard**: Comprehensive reporting and analytics
- **Company Management**: Multi-company support with role-based access
- **Real-time Messaging**: In-app communication system
- **Search & Filters**: Advanced search capabilities with saved searches
- **Export Functionality**: PDF and data export features

## 🛠️ Tech Stack

- **Frontend**: React 18, JavaScript/TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **HTTP Client**: Axios
- **Authentication**: JWT tokens

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── forms/          # Form components (Login, Register, etc.)
│   ├── layout/         # Layout components (Sidebar, MainAppLayout)
│   ├── modals/         # Modal components
│   └── ui/             # General UI components
├── pages/              # Page components
├── context/            # React Context providers
├── api/                # API configuration
├── utils/              # Utility functions
├── services/           # Service layer
├── constants/          # Application constants
├── hooks/              # Custom React hooks
└── assets/             # Static assets
    ├── images/         # Image files
    └── icons/          # Icon files
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/APasu12/ReVolt-Marketplace.git
cd ReVolt-Marketplace
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 📝 Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## 🔧 Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

```
REACT_APP_API_URL=your_api_url_here
REACT_APP_APP_NAME=VoltaLog
```

## 📊 Key Components

- **MainAppLayout**: Main application layout with navigation
- **AuthContext**: Authentication state management
- **MarketplaceComponent**: Battery marketplace functionality
- **AnalyticsComponent**: Data visualization and reporting
- **MyBatteriesComponent**: Battery inventory management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.
