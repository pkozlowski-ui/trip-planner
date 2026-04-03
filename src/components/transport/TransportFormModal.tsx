import { useState, useEffect } from 'react';
import {
  Modal,
  TextArea,
  Select,
  SelectItem,
  Form,
  FormGroup,
  Loading,
} from '@carbon/react';
import { TravelType } from '../../types';

interface TransportFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransportFormData) => Promise<void>;
  initialData?: Partial<TransportFormData>;
  isSubmitting?: boolean;
  isEditMode?: boolean;
}

export interface TransportFormData {
  type: TravelType;
  notes?: string;
}

const TRAVEL_TYPES: { value: TravelType; label: string }[] = [
  { value: 'car', label: 'Car' },
  { value: 'walking', label: 'Walking' },
  { value: 'public-transport', label: 'Public Transport' },
  { value: 'bike', label: 'Bike' },
];

function TransportFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
  isEditMode = false,
}: TransportFormModalProps) {
  const [formData, setFormData] = useState<TransportFormData>({
    type: initialData?.type || 'walking',
    notes: initialData?.notes || '',
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'walking',
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        type: initialData?.type || 'walking',
        notes: initialData?.notes || '',
      });
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (field: keyof TransportFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      open={open}
      modalHeading={isEditMode ? 'Edit Transport' : 'Add Transport'}
      modalLabel="Transport Details"
      primaryButtonText={isSubmitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Transport' : 'Add Transport')}
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={isSubmitting}
      size="sm"
    >
      <Form onSubmit={handleSubmit}>
        <FormGroup legendText="Transport Information">
          <Select
            id="transport-type"
            labelText="Transport Type *"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value as TravelType)}
            disabled={isSubmitting}
          >
            {TRAVEL_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value} text={type.label} />
            ))}
          </Select>

          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f4f4f4', borderRadius: '4px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
              Distance and time will be calculated automatically based on the selected locations.
            </p>
          </div>

          <TextArea
            id="transport-notes"
            labelText="Notes"
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Optional notes about this transport"
            rows={2}
            disabled={isSubmitting}
          />
        </FormGroup>

        {isSubmitting && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <Loading description={isEditMode ? 'Updating transport...' : 'Adding transport...'} withOverlay={false} small />
          </div>
        )}
      </Form>
    </Modal>
  );
}

export default TransportFormModal;
