import validator from "validator";

export const validate = (params) => {
    let name = !validator.isEmpty(params.name) &&
        validator.isLength(params.name, { min: 3, max: undefined }) &&
        validator.isAlpha(params.name, "es-ES");

    let surname = !validator.isEmpty(params.surname) &&
        validator.isLength(params.surname, { min: 3, max: undefined }) &&
        validator.isAlpha(params.surname, "es-ES");

    let email = !validator.isEmpty(params.email) && validator.isEmail(params.email);

    let password = !validator.isEmpty(params.password);
        //&& validator.isStrongPassword(params.password, { minLength: 5, minNumbers: 1 });

    if (!name || !surname || !email || !password) {
        throw new Error("No se ha superado la validación");
    } else {
        console.log("Validación superada.");
    }
};
