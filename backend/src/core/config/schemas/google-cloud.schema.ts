import * as Joi from 'joi';

export const googleCloudConfigSchema = {
  GOOGLE_CLOUD_PROJECT: Joi.string().required(),
  GOOGLE_CLOUD_BUCKET: Joi.string().required(),
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string().required(),
};
