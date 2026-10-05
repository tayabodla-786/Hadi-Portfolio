import React from 'react';
import {Outlet} from "react-router-dom";
import ScrollRestoration from '../components/ScrollRestoration';

const MainLayout = () => {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
};

export default MainLayout
