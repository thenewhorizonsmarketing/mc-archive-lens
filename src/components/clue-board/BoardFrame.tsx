import React from 'react';
import './BoardFrame.css';

export const BoardFrame: React.FC = () => {
  return (
    <div className="board-frame">
      <div className="frame-top" />
      <div className="frame-right" />
      <div className="frame-bottom" />
      <div className="frame-left" />
      <div className="frame-corner frame-corner-tl" />
      <div className="frame-corner frame-corner-tr" />
      <div className="frame-corner frame-corner-bl" />
      <div className="frame-corner frame-corner-br" />
    </div>
  );
};
