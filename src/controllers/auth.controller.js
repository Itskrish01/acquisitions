import logger from '#config/logger.js';
import { createUser } from '#services/auth.service.js';
import { cookies } from '#utils/cookies.js';
import { formatValidationError } from '#src/utils/format.js';
import { jwttoken } from '#src/utils/jwt.js';
import { signupSchema } from '#validations/auth.validation.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if(!validationResult.success){
      return res.status(400).json({ message: 'Validation failed', details: formatValidationError(validationResult.error) });
    }

    const { name,  email, role, password } = validationResult.data;

    const user = await createUser({name , email, password, role });

    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });

    cookies.set(res,  'token', token);

    logger.info(`User signed up succesfully with name: ${name}, email: ${email}, role: ${role}`);

    res.status(201).json({ message: 'User signed up successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role } });

  }catch (error) {
    logger.error('Error in signup controller:', error);

    if(error.message === 'User with this email already  exists'){
      return res.status(409).json({ message: 'Email already exist' });
    }

    next(error);
  }
};