import { Transport } from '../../types';
import { Car, Pedestrian, Train, CircleFilled, OverflowMenuVertical } from '@carbon/icons-react';
import { OverflowMenu, OverflowMenuItem, Tile } from '@carbon/react';
import { getDayColor } from '../../utils/dayColors';

interface TransportCardProps {
  transport: Transport;
  dayNumber: number;
  fromLocationName: string;
  toLocationName: string;
  onEdit?: (transport: Transport) => void;
  onDelete?: (transportId: string) => void;
}

function TransportCard({ transport, dayNumber, onEdit, onDelete }: TransportCardProps) {
  const dayColor = getDayColor(dayNumber);

  const getTransportIcon = () => {
    switch (transport.type) {
      case 'car':
        return Car;
      case 'walking':
        return Pedestrian;
      case 'public-transport':
        return Train;
      case 'bike':
        return CircleFilled;
      default:
        return Pedestrian;
    }
  };

  const getTransportLabel = () => {
    switch (transport.type) {
      case 'car':
        return 'Car';
      case 'walking':
        return 'Walking';
      case 'public-transport':
        return 'Public Transport';
      case 'bike':
        return 'Bike';
      default:
        return 'Transport';
    }
  };

  const IconComponent = getTransportIcon();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transport);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(`Are you sure you want to delete this transport?`)) {
      onDelete(transport.id);
    }
  };

  return (
    <Tile
      className={`transport-card ${onEdit || onDelete ? 'transport-card--with-actions' : ''}`}
    >
      <IconComponent size={16} style={{ color: dayColor, flexShrink: 0 }} />
      <div className="transport-card__label">
        {getTransportLabel()}
      </div>
      {(transport.distance || transport.time) && (
        <div className="transport-card__meta">
          {transport.distance && <span>{transport.distance.toFixed(1)} km</span>}
          {transport.distance && transport.time && <span> • </span>}
          {transport.time && <span>{transport.time}</span>}
        </div>
      )}
      {(onEdit || onDelete) && (
        <div
          className="transport-card__actions"
          onClick={(e) => e.stopPropagation()}
        >
          <OverflowMenu
            renderIcon={OverflowMenuVertical}
            size="sm"
            flipped
            ariaLabel="Transport options"
          >
            {onEdit && (
              <OverflowMenuItem
                itemText="Edit"
                onClick={handleEdit}
              />
            )}
            {onDelete && (
              <OverflowMenuItem
                itemText="Delete"
                onClick={handleDelete}
                isDelete
                hasDivider={!!onEdit}
              />
            )}
          </OverflowMenu>
        </div>
      )}
    </Tile>
  );
}

export default TransportCard;
