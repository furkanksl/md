import { WindowControls } from './window-controls';

export const CustomTitlebar = () => {
  return (
    <div 
      className="h-full flex items-center justify-end px-2 select-none shrink-0"
    >
      <WindowControls />
    </div>
  );
};
