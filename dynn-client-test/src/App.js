import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import './App.css';
import ChooseScreen from './screens/ChooseScreen';
import HomeScreen from './screens/HomeScreen';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import OrderScreen from './screens/OrderScreen';
import ReviewScreen from './screens/ReviewScreen';
import SelectPaymentScreen from './screens/SelectPaymentScreen';
import CompleteOrderScreen from './screens/CompleteOrderScreen';
import KitchenScreen from './screens/newkitch';
import AdminScreen from './screens/AdminScreen';
import PaymentScreen from './screens/PaymentScreen';
import Failed from './screens/failed';
import DetailsPage from './screens/DetailsPage';

const theme = createTheme({
  typography: {
    h1: { fontWeight: 'bold' },
    h2: {
      fontSize: '2rem',
      color: 'black',
    },
    h3: {
      fontSize: '1.8rem',
      fontWeight: 'bold',
      color: 'white',
    },
  },
  palette: {
    primary: { main: '#ff1744' },
    secondary: {
      main: '#118e16',
      contrastText: '#ffffff',
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <>
          <Routes>
            <Route path='/' element={<HomeScreen />} />
            <Route path='/admin' element={<AdminScreen />} />
            <Route path='/choose' element={<ChooseScreen />} />
            <Route path='/order' element={<OrderScreen />} />
            <Route path='/review' element={<ReviewScreen />} />
            <Route path='/select-payment' element={<SelectPaymentScreen />} />
            <Route path='/complete' element={<CompleteOrderScreen />} />
            <Route path='/payment' element={<PaymentScreen />} />
            <Route path='/kitchen' element={<KitchenScreen />} />
            <Route path='/failed' element={<Failed />} />
            <Route path="/detailspage/:productName" element={<DetailsPage />} />
          </Routes>
        </>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
