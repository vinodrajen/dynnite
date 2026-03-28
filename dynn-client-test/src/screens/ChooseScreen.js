import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBucket } from '@fortawesome/free-solid-svg-icons';
import Logo from '../components/Logo';
import { Store } from './Store';
import { setOrderType } from '../actions';
import '../components/choose.css';

export default function ChooseScreen() {
  const { dispatch } = useContext(Store);
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const tableno = urlParams.get('tableno') || 1;

  const chooseHandler = (orderType) => {
    setOrderType(dispatch, orderType);
    navigate(`/order?tableno=${tableno}`);
  };

  return (
    <div>
      <div className="navbar">
        <div className="navbar_left">
          <span className="logo_text">DYNNITE</span>
        </div>
        <div className="navbar_right">
          <FontAwesomeIcon icon={faBucket} />
        </div>
      </div>
      <div className="choose_screen">
        <div className="main">
          <div className="center">
            <Logo className="logo" />
          </div>
          <h3 className="center">Where will you be eating today?</h3>
          <div className="center" style={{ gap: '20px', marginTop: '20px' }}>
            <button
              className="choose_btn"
              onClick={() => chooseHandler('Eat in')}
              style={{
                padding: '20px 40px',
                fontSize: '1.2rem',
                cursor: 'pointer',
                borderRadius: '10px',
                border: '2px solid #ff1744',
                background: '#ff1744',
                color: '#fff',
              }}
            >
              Eat In
            </button>
            <button
              className="choose_btn"
              onClick={() => chooseHandler('Takeaway')}
              style={{
                padding: '20px 40px',
                fontSize: '1.2rem',
                cursor: 'pointer',
                borderRadius: '10px',
                border: '2px solid #ff1744',
                background: '#fff',
                color: '#ff1744',
              }}
            >
              Takeaway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
