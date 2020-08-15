import React from 'react';
import clsx from 'clsx';
import { useDrop } from 'react-dnd';
import { mobileDragType } from 'app/inventory/DraggableInventoryItem';
import styles from './ItemActionButton.m.scss';
import PressTip from 'app/dim-ui/PressTip';

export function ItemActionButtonGroup({ children }: { children: React.ReactNode }) {
  return <div className={styles.locations}>{children}</div>;
}

/**
 * Buttons for the ItemActions component. These show the applicable
 * actions for the given store to move/equip the given item.
 */
export default function ItemActionButton({
  title,
  label,
  icon,
  className,
  onClick,
}: {
  title: string;
  label: string;
  icon?: string;
  className?: string;
  onClick(): void;
}) {
  // Support dropping items on the action buttons on mobile
  const [{ hovering }, drop] = useDrop({
    accept: mobileDragType,
    drop: onClick,
    collect: (monitor) => ({ hovering: Boolean(monitor.isOver()) }),
  });

  return (
    <PressTip tooltip={title} forceOpen={hovering}>
      <div
        ref={drop}
        className={clsx(styles.button, className)}
        title={title}
        aria-label={title}
        onClick={onClick}
        style={icon ? { backgroundImage: `url("${icon}")` } : undefined}
      >
        <span>{label}</span>
      </div>
    </PressTip>
  );
}
