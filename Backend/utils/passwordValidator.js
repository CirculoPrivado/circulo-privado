const PASSWORD_MIN_LENGTH = 8;
const SPECIAL_CHARACTER_REGEX = /[^A-Za-z0-9]/;

const validarPasswordSegura = (password = "") => {
  if (typeof password !== "string") {
    return {
      esValida: false,
      message: "La contraseña es obligatoria",
    };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      esValida: false,
      message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    };
  }

  if (!SPECIAL_CHARACTER_REGEX.test(password)) {
    return {
      esValida: false,
      message: "La contraseña debe contener al menos un carácter especial",
    };
  }

  return {
    esValida: true,
    message: "Contraseña válida",
  };
};

module.exports = {
  PASSWORD_MIN_LENGTH,
  SPECIAL_CHARACTER_REGEX,
  validarPasswordSegura,
};
