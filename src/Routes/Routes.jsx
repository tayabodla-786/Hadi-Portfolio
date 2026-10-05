import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Studio from '../studio/Studio.jsx';

// One page; anything else (including the retired /ascent and /particles) goes home
const router = createBrowserRouter([
  { path: '/', element: <Studio /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

const Routes = () => <RouterProvider router={router} />;

export default Routes;
