import * as Yup from "yup";
export const finishSchema = Yup.object({
  contactName: Yup.string().trim().required('Contact name is required'),
  contactPhone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Enter valid phone number')
    .required('Phone number is required'),
  cancellationPolicy: Yup.string().required('Select cancellation policy'),
  venuePhotos: Yup.array().min(1, 'Upload at least one photo'),
  refundType: Yup.string().when('cancellationPolicy', {
    is: 'refundable',
    then: (schema) =>
      schema.oneOf(['fullRefund', 'timeBasedRefund']).required('Select refund type'),
  }),
  refundRules: Yup.array().when(['cancellationPolicy', 'refundType'], {
    is: (policy: string, type: string) =>
      policy === 'refundable' && type === 'timeBasedRefund',
    then: () =>
      Yup.array()
        .of(
          Yup.object({
            daysBefore: Yup.number().integer().min(0).required('Required'),
            refundPercentage: Yup.number().min(0).max(100).required('Required'),
          })
        )
        .min(1, 'Add at least one refund rule'),
  }),
});