import { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  TextArea,
  Form,
  FormGroup,
  Loading,
  DatePicker,
  DatePickerInput,
  Button,
} from '@carbon/react';
import { TrashCan } from '@carbon/icons-react';

interface TripPlanFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TripPlanFormData) => Promise<void>;
  initialData?: Partial<TripPlanFormData>;
  isSubmitting?: boolean;
  isEditMode?: boolean;
  /** When set, shows a "Delete plan" option (edit mode only). */
  planId?: string;
  /** Called when user confirms plan deletion. Parent should delete, close modal, and navigate. */
  onDeletePlan?: (planId: string) => Promise<void>;
}

export interface TripPlanFormData {
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}

function TripPlanFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
  isEditMode = false,
  planId,
  onDeletePlan,
}: TripPlanFormModalProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<TripPlanFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    startDate: initialData?.startDate,
    endDate: initialData?.endDate,
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        startDate: initialData.startDate,
        endDate: initialData.endDate,
      });
    }
  }, [initialData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        title: initialData?.title || '',
        description: initialData?.description || '',
        startDate: initialData?.startDate,
        endDate: initialData?.endDate,
      });
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleChange = (field: keyof TripPlanFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteClick = () => setConfirmDeleteOpen(true);
  const handleConfirmDeleteClose = () => {
    if (!isDeleting) setConfirmDeleteOpen(false);
  };
  const handleConfirmDelete = async () => {
    if (!planId || !onDeletePlan) return;
    setIsDeleting(true);
    try {
      await onDeletePlan(planId);
      setConfirmDeleteOpen(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const showDeleteOption = isEditMode && planId && onDeletePlan;

  return (
    <>
    <Modal
      open={open}
      modalHeading={isEditMode ? 'Edit Trip Plan' : 'Create Trip Plan'}
      modalLabel="Trip Plan Details"
      primaryButtonText={isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Plan' : 'Create Plan')}
      secondaryButtonText="Cancel"
      onRequestClose={onClose}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={isSubmitting || !formData.title.trim()}
      size="sm"
    >
      <Form onSubmit={handleSubmit}>
        <FormGroup legendText="Basic Information">
          <TextInput
            id="plan-title"
            labelText="Plan Title *"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter trip plan title"
            required
            disabled={isSubmitting}
          />

          <TextArea
            id="plan-description"
            labelText="Description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Enter description"
            rows={3}
            disabled={isSubmitting}
          />
        </FormGroup>

        <FormGroup legendText="Dates (Optional)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <DatePicker
              datePickerType="single"
              value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
              onChange={(dates: Date[]) => {
                handleChange('startDate', dates[0] || undefined);
              }}
            >
              <DatePickerInput
                id="start-date"
                labelText="Start Date"
                placeholder="mm/dd/yyyy"
                disabled={isSubmitting}
              />
            </DatePicker>

            <DatePicker
              datePickerType="single"
              value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
              onChange={(dates: Date[]) => {
                handleChange('endDate', dates[0] || undefined);
              }}
            >
              <DatePickerInput
                id="end-date"
                labelText="End Date"
                placeholder="mm/dd/yyyy"
                disabled={isSubmitting}
              />
            </DatePicker>
          </div>
        </FormGroup>

        {isSubmitting && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <Loading description={isEditMode ? 'Updating plan...' : 'Creating plan...'} withOverlay={false} small />
          </div>
        )}

        {showDeleteOption && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--cds-border-subtle)' }}>
            <Button
              kind="danger--ghost"
              size="sm"
              renderIcon={TrashCan}
              iconDescription="Delete plan"
              onClick={handleDeleteClick}
              disabled={isSubmitting}
            >
              Delete plan
            </Button>
          </div>
        )}
      </Form>
    </Modal>

    <Modal
      open={confirmDeleteOpen}
      modalHeading="Delete trip plan?"
      modalLabel="Confirm"
      primaryButtonText={isDeleting ? 'Deleting...' : 'Delete'}
      secondaryButtonText="Cancel"
      danger
      onRequestClose={handleConfirmDeleteClose}
      onRequestSubmit={handleConfirmDelete}
      primaryButtonDisabled={isDeleting}
      size="xs"
    >
      <p>This will permanently delete this plan and all its days and locations. This action cannot be undone.</p>
      {isDeleting && (
        <div style={{ marginTop: '1rem' }}>
          <Loading description="Deleting plan..." withOverlay={false} small />
        </div>
      )}
    </Modal>
    </>
  );
}

export default TripPlanFormModal;
