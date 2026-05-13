interface Props {
  onDragStart: (e: React.MouseEvent) => void;
  dragging?: boolean;
}

export default function ConnectorDot({ onDragStart, dragging }: Props) {
  return (
    <div
      className={`connector-dot${dragging ? ' connector-dot--dragging' : ''}`}
      onMouseDown={e => {
        e.stopPropagation();
        e.preventDefault();
        onDragStart(e);
      }}
    />
  );
}
