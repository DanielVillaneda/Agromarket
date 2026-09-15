const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toPublicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    telefono: user.telefono,
  };
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  });
}

async function register(req, res) {
  const { nombre, email, telefono, password } = req.body ?? {};

  if (!nombre || String(nombre).trim().length < 3) {
    return res.status(400).json({ message: 'El nombre debe tener al menos 3 caracteres.' });
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Ingresa un correo electrónico válido.' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: 'Ya existe una cuenta registrada con ese correo.' });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  const user = await prisma.user.create({
    data: { nombre, email, telefono: telefono ?? null, password: passwordHash },
  });

  const token = signToken(user.id);
  return res.status(201).json({ token, user: toPublicUser(user) });
}

async function login(req, res) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Ingresa tu correo y contraseña.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
  }

  const matches = await bcrypt.compare(String(password), user.password);
  if (!matches) {
    return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
  }

  const token = signToken(user.id);
  return res.json({ token, user: toPublicUser(user) });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }
  return res.json({ user: toPublicUser(user) });
}

module.exports = { register, login, me };
