import * as Yup from 'yup';

export const finishSchema = Yup.object({
  contact: Yup.object({
    name: Yup.string().trim().required('Contact name is required'),
    phone: Yup.string()
      .matches(/^[6-9]\d{9}$/, 'Enter valid phone number')
      .required('Phone number is required'),
    email: Yup.string().email('Must be a valid email').optional(),
  }),
  cancellation: Yup.object({
    policy: Yup.string().required('Select cancellation policy'),
    refundType: Yup.string().when('policy', {
      is: 'refundable',
      then: (schema) =>
        schema.oneOf(['fullRefund', 'timeBasedRefund']).required('Select refund type'),
    }),
    refundRules: Yup.array().when(['policy', 'refundType'], {
      is: (policy: string, type: string) => policy === 'refundable' && type === 'timeBasedRefund',
      then: () =>
        Yup.array(
          Yup.object({
            daysBefore: Yup.number().integer().min(0).required('Required'),
            refundPercentage: Yup.number().min(0).max(100).required('Required'),
          })
        ).min(1, 'Add at least one refund rule'),
    }),
  }),
  venuePhotos: Yup.array().min(1, 'Upload at least one photo'),
});
