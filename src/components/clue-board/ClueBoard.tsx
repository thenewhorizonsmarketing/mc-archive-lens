import React from 'react';
import { BoardFrame } from './BoardFrame';
import { PerformanceMonitor } from './PerformanceMonitor';
import './ClueBoard.css';

interface ClueBoardProps {
  children: React.ReactNode;
  showPerformanceMonitor?: boolean;
}

export const ClueBoard: React.FC<ClueBoardProps> = ({ 
  children, 
  showPerformanceMonitor = false 
}) => {
  return (
    <div className="clue-board" aria-label="MC Museum & Archives Navigation Board">
      <BoardFrame />
      <div className="board-content">
        {children}
      </div>
      <PerformanceMonitor enabled={showPerformanceMonitor} />
    </div>
  );
};
