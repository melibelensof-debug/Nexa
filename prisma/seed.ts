import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const categories = [
  { name: "Gastronomía", icon: "🍽️" },
  { name: "Moda", icon: "👗" },
  { name: "Tecnología", icon: "💻" },
  { name: "Servicios", icon: "🛠️" },
  { name: "Belleza", icon: "💅" },
  { name: "Hogar", icon: "🏠" },
  { name: "Salud", icon: "🩺" },
  { name: "Educación", icon: "📚" },
  { name: "Arte y diseño", icon: "🎨" },
  { name: "Mascotas", icon: "🐾" },
];

const regions = [
  "Buenos Aires",
  "Córdoba",
  "Mendoza",
  "Rosario",
  "Salta",
  "La Plata",
  "Mar del Plata",
  "Tucumán",
  "Neuquén",
  "Bariloche",
];

type SeedBusiness = {
  name: string;
  description: string;
  category: string; // slug categoría
  region: string;   // slug región
  email?: string;
  phone?: string;
  website?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  address?: string;
};

const businesses: SeedBusiness[] = [
  // Gastronomía
  {
    name: "Panadería La Esquina",
    description: "Panadería artesanal con productos sin TACC y panes de masa madre.",
    category: "gastronomia",
    region: "buenos-aires",
    instagram: "panaderialaesquina",
    whatsapp: "+5491111111111",
    address: "Av. Corrientes 1234, CABA",
  },
  {
    name: "Café Trinidad",
    description: "Cafetería de especialidad con granos de origen único y brunch los fines de semana.",
    category: "gastronomia",
    region: "cordoba",
    instagram: "cafetrinidad",
    phone: "+543514567890",
  },
  {
    name: "Empanadas del Norte",
    description: "Empanadas salteñas tradicionales horneadas en horno de barro.",
    category: "gastronomia",
    region: "salta",
    whatsapp: "+5493871234567",
    facebook: "empanadasdelnorte",
  },
  {
    name: "Heladería Artesanal Polo",
    description: "Heladería artesanal con sabores regionales: dulce de leche granizado, calafate y más.",
    category: "gastronomia",
    region: "bariloche",
    instagram: "polo.helados",
    address: "Mitre 250, Bariloche",
  },
  {
    name: "Pizzería Don Mario",
    description: "Pizza a la piedra al estilo argentino, con receta familiar de tres generaciones.",
    category: "gastronomia",
    region: "rosario",
    phone: "+543415551122",
    facebook: "donmariopizza",
  },

  // Moda
  {
    name: "Telar Andino",
    description: "Indumentaria tejida a mano con lana de oveja y teñidos naturales.",
    category: "moda",
    region: "mendoza",
    instagram: "telar.andino",
    website: "https://telarandino.example",
  },
  {
    name: "Boutique Aurora",
    description: "Diseño de autor en prendas femeninas, producción local de pequeña escala.",
    category: "moda",
    region: "buenos-aires",
    instagram: "boutique.aurora",
    whatsapp: "+5491122334455",
  },
  {
    name: "Calzados Pampa",
    description: "Zapatos de cuero argentino, hechos a mano por artesanos de la región.",
    category: "moda",
    region: "la-plata",
    instagram: "calzadospampa",
    phone: "+542215557788",
  },
  {
    name: "Atelier Norte",
    description: "Sastrería y arreglos de prendas finas, atención personalizada.",
    category: "moda",
    region: "tucuman",
    facebook: "ateliernorte",
  },

  // Tecnología
  {
    name: "Estudio Pixel",
    description: "Desarrollo web y diseño UX para pymes y emprendedores.",
    category: "tecnologia",
    region: "cordoba",
    website: "https://estudiopixel.example",
    email: "hola@estudiopixel.example",
  },
  {
    name: "Códigos del Sur",
    description: "Software a medida y consultoría en transformación digital.",
    category: "tecnologia",
    region: "buenos-aires",
    website: "https://codigosdelsur.example",
    instagram: "codigosdelsur",
  },
  {
    name: "TecnoSoporte Mendoza",
    description: "Servicio técnico de PCs, notebooks y redes para empresas.",
    category: "tecnologia",
    region: "mendoza",
    phone: "+542614556677",
    whatsapp: "+542614556677",
  },
  {
    name: "DataLab Patagonia",
    description: "Análisis de datos y dashboards a medida para retail y turismo.",
    category: "tecnologia",
    region: "neuquen",
    website: "https://datalabpat.example",
    email: "contacto@datalabpat.example",
  },

  // Servicios
  {
    name: "Mudanzas Express",
    description: "Mudanzas locales y de larga distancia con personal capacitado.",
    category: "servicios",
    region: "rosario",
    phone: "+543415554433",
    whatsapp: "+543415554433",
  },
  {
    name: "Contadores Asociados Salta",
    description: "Asesoramiento contable e impositivo para pymes y monotributistas.",
    category: "servicios",
    region: "salta",
    email: "info@contsalta.example",
    phone: "+543874442211",
  },
  {
    name: "Limpieza Crystal",
    description: "Servicios de limpieza para oficinas, consorcios y locales comerciales.",
    category: "servicios",
    region: "mar-del-plata",
    whatsapp: "+542235551234",
    instagram: "limpiezacrystal",
  },

  // Belleza
  {
    name: "Estudio de Uñas Lila",
    description: "Esmaltado semipermanente, diseños personalizados y manicuría rusa.",
    category: "belleza",
    region: "buenos-aires",
    instagram: "estudiouna.lila",
    whatsapp: "+5491133221100",
  },
  {
    name: "Peluquería Origen",
    description: "Cortes, color y tratamientos capilares con productos veganos.",
    category: "belleza",
    region: "cordoba",
    instagram: "peluqueriaorigen",
    address: "Bv. Illia 450, Córdoba",
  },
  {
    name: "Spa Serena",
    description: "Masajes descontracturantes, faciales y terapias de relajación.",
    category: "belleza",
    region: "bariloche",
    website: "https://spaserena.example",
    phone: "+542944333222",
  },

  // Hogar
  {
    name: "Maderas y Diseño",
    description: "Muebles de algarrobo a medida, hechos por carpinteros locales.",
    category: "hogar",
    region: "tucuman",
    instagram: "maderasydiseno",
    whatsapp: "+543814112233",
  },
  {
    name: "Plantas Verdes",
    description: "Vivero con plantas de interior, suculentas y asesoramiento gratis.",
    category: "hogar",
    region: "la-plata",
    facebook: "plantasverdesvivero",
    address: "Calle 13 entre 50 y 51, La Plata",
  },
  {
    name: "Iluminación Norte",
    description: "Lámparas artesanales y diseño de iluminación para hogares y comercios.",
    category: "hogar",
    region: "salta",
    website: "https://iluminacionnorte.example",
  },

  // Salud
  {
    name: "Centro de Kinesiología Avanzar",
    description: "Rehabilitación deportiva, traumatológica y respiratoria.",
    category: "salud",
    region: "rosario",
    phone: "+543415557766",
    email: "turnos@avanzarkine.example",
  },
  {
    name: "Nutrición Consciente",
    description: "Acompañamiento nutricional online y presencial, planes personalizados.",
    category: "salud",
    region: "buenos-aires",
    instagram: "nutricion.consciente",
    whatsapp: "+5491145678899",
  },
  {
    name: "Odontología Sonrisa Plus",
    description: "Odontología general, ortodoncia y estética dental.",
    category: "salud",
    region: "mendoza",
    phone: "+542614778899",
    address: "San Martín 1500, Mendoza",
  },

  // Educación
  {
    name: "Academia Idiomas Babel",
    description: "Clases de inglés, portugués y francés en grupos reducidos.",
    category: "educacion",
    region: "cordoba",
    website: "https://babelidiomas.example",
    email: "info@babelidiomas.example",
  },
  {
    name: "Robótica Kids",
    description: "Talleres de robótica y programación para niños de 6 a 14 años.",
    category: "educacion",
    region: "buenos-aires",
    instagram: "robotica.kids",
    phone: "+5491155667788",
  },
  {
    name: "Estudio Música del Sur",
    description: "Clases de guitarra, piano y canto, todos los niveles.",
    category: "educacion",
    region: "neuquen",
    facebook: "musicadelsurestudio",
  },

  // Arte y diseño
  {
    name: "Galería Origen",
    description: "Galería de arte con exposiciones rotativas de artistas emergentes.",
    category: "arte-y-diseno",
    region: "buenos-aires",
    website: "https://galeriaorigen.example",
    instagram: "galeria.origen",
  },
  {
    name: "Cerámica Luna",
    description: "Vajilla y objetos de cerámica artesanal hechos a torno.",
    category: "arte-y-diseno",
    region: "mar-del-plata",
    instagram: "ceramica.luna",
    whatsapp: "+542235559911",
  },
  {
    name: "Imprenta Tinta Viva",
    description: "Imprenta tradicional, tipografía móvil y papelería de boda.",
    category: "arte-y-diseno",
    region: "la-plata",
    email: "hola@tintaviva.example",
  },

  // Mascotas
  {
    name: "Veterinaria Patitas",
    description: "Atención veterinaria 24hs, vacunación y peluquería canina.",
    category: "mascotas",
    region: "rosario",
    phone: "+543415552288",
    address: "Pellegrini 800, Rosario",
  },
  {
    name: "Peluquería Canina Guau",
    description: "Baño, corte y estética para perros y gatos. Productos hipoalergénicos.",
    category: "mascotas",
    region: "buenos-aires",
    instagram: "guaupelu",
    whatsapp: "+5491166778899",
  },
  {
    name: "Adiestramiento Andino",
    description: "Adiestramiento canino positivo, sesiones individuales y grupales.",
    category: "mascotas",
    region: "mendoza",
    facebook: "adiestramientoandino",
  },
];

async function main() {
  // Categorías
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: { icon: c.icon },
      create: { name: c.name, slug: slugify(c.name), icon: c.icon },
    });
  }

  // Regiones
  for (const r of regions) {
    await prisma.region.upsert({
      where: { slug: slugify(r) },
      update: {},
      create: { name: r, slug: slugify(r) },
    });
  }

  // Usuario demo
  const demoEmail = "demo@nexa.local";
  const demo = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: "Cuenta Demo",
      passwordHash: await bcrypt.hash("demo1234", 10),
    },
  });

  // Negocios
  for (const b of businesses) {
    const cat = await prisma.category.findUnique({ where: { slug: b.category } });
    const reg = await prisma.region.findUnique({ where: { slug: b.region } });
    if (!cat || !reg) {
      console.warn(`Saltando ${b.name}: categoría/región no encontrada`);
      continue;
    }

    await prisma.business.upsert({
      where: { slug: slugify(b.name) },
      update: {},
      create: {
        name: b.name,
        slug: slugify(b.name),
        description: b.description,
        categoryId: cat.id,
        regionId: reg.id,
        email: b.email,
        phone: b.phone,
        website: b.website,
        whatsapp: b.whatsapp,
        instagram: b.instagram,
        facebook: b.facebook,
        address: b.address,
        ownerId: demo.id,
      },
    });
  }

  const total = await prisma.business.count();
  console.log(`Seed completo. Total negocios: ${total}`);
  console.log(`Usuario demo: ${demoEmail} / demo1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
