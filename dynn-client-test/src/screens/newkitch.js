import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Table, TableHead, TableBody, TableRow, TableCell, Button } from '@mui/material';
import '../components/kitchen.css';

export default function KitchenScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASEURL}/api/orders`);
      setOrders(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error fetching orders');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // WebSocket for real-time updates (using native WebSocket, not socket.io)
  useEffect(() => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
    let socket;
    let reconnectTimeout;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            // Initial orders dump from server
            setOrders(data);
            setLoading(false);
          } else {
            // Single order update - refresh the full list
            fetchOrders();
          }
        } catch (e) {
          // ignore non-JSON messages like the connection established string
        }
      };

      socket.onclose = () => {
        reconnectTimeout = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [fetchOrders]);

  const setOrderStateHandler = async (orderId, action) => {
    try {
      await axios.put(`${process.env.REACT_APP_BASEURL}/api/orders/${orderId}`, {
        action: action,
      });
      fetchOrders();
    } catch (err) {
      console.error('Error updating order state:', err);
      alert(err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className='kitchen_contents'>
      <h2 className='kitchen_heading'>Kitchen Screen</h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order Number</TableCell>
            <TableCell>Table Number</TableCell>
            <TableCell>Item Name</TableCell>
            <TableCell>Item Quantity</TableCell>
            <TableCell>Served</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order._id}>
              <TableCell>{order.number}</TableCell>
              <TableCell>{order.tableno}</TableCell>
              <TableCell>
                {order.orderItems.map((item) => (
                  <div key={item._id}>{item.name}</div>
                ))}
              </TableCell>
              <TableCell>
                {order.orderItems.map((item) => (
                  <div key={item._id}>{item.quantity}</div>
                ))}
              </TableCell>
              <TableCell>{order.isServed ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOrderStateHandler(order._id, 'serve')}
                  disabled={order.isServed}
                >
                  Serve
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
