const Joi = require("joi");
const { phone } = require("phone"); // библиотека для валидации телефонов

// Кастомная валидация для Joi
export const idSchema = Joi.alternatives()
  .try(
    Joi.string().email(),
    Joi.string().custom((value: string, helpers: any) => {
      const { isValid } = phone(value);
      if (!isValid) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "phone validation")
  )
  .required();
