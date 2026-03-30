import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  Mail, 
  ExternalLink, 
  Camera, 
  ChevronRight,
  Menu,
  X,
  Plus,
  Upload,
  Lock,
  Trash2,
  Loader2
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// --- Types ---

interface ImageEdit {
  id: string;
  beforeUrl: string;
  afterUrl: string;
  label: string;
  createdAt: any;
}

// --- Components ---

const Navbar = ({ onAdminClick }: { onAdminClick: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Galería', href: '#galeria' },
    { name: 'Contacto', href: '#contacto' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-brand-cream/80 backdrop-blur-md border-b border-brand-ink/5">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <a 
          href="#home" 
          onClick={(e) => handleNavClick(e, '#home')}
          className="display text-3xl font-black tracking-tighter relative group"
        >
          TABITO
          <span className="absolute -bottom-2 -right-4 sticker scale-50 opacity-0 group-hover:opacity-100 transition-opacity">STUDIO</span>
        </a>
        
        <div className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => (
            <a 
              key={item.name} 
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-xs uppercase tracking-[0.2em] font-black hover:text-brand-accent transition-colors relative group"
            >
              {item.name}
              <span className="absolute -top-4 -right-4 sticker scale-50 opacity-0 group-hover:opacity-100 transition-opacity">GO</span>
            </a>
          ))}
          <button 
            onClick={onAdminClick}
            className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors"
          >
            <Lock size={16} className="text-brand-ink/40" />
          </button>
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-brand-cream border-b border-brand-ink/10 md:hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navItems.map((item) => (
                <a 
                  key={item.name} 
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-4xl display hover:text-brand-accent transition-colors flex items-center justify-between group"
                >
                  {item.name}
                  <span className="sticker scale-50 opacity-0 group-hover:opacity-100 transition-opacity">GO</span>
                </a>
              ))}
              <button 
                onClick={() => { onAdminClick(); setIsOpen(false); }}
                className="text-left text-xs uppercase tracking-widest font-black opacity-40 mt-4"
              >
                Admin Mode
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const BeforeAfter = ({ before, after, label, isAdmin, onDelete }: { before: string, after: string, label: string, isAdmin?: boolean, onDelete?: () => void }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(Math.max(position, 0), 100));
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto px-4 md:px-0">
      <div 
        ref={containerRef}
        className="relative aspect-[4/3] overflow-hidden rounded-urban cursor-ew-resize group shadow-2xl border-4 border-white"
        onMouseMove={handleMove}
        onTouchMove={handleMove}
      >
        <img 
          src={after} 
          alt="After" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        
        <div 
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <img 
            src={before} 
            alt="Before" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-brand-accent pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-brand-accent rounded-sm flex items-center justify-center border border-white/20">
            <div className="flex gap-1">
              <div className="w-0.5 h-3 bg-white/40 rounded-full" />
              <div className="w-0.5 h-3 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>

        <div className="absolute top-4 left-4 sticker bg-brand-ink text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">
          Antes
        </div>
        <div className="absolute top-4 right-4 sticker opacity-0 group-hover:opacity-100 transition-opacity z-20">
          Después
        </div>
        
        {isAdmin && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="absolute bottom-4 right-4 p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-30"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-center display text-2xl text-brand-ink/80">{label}</p>
        <div className="w-12 h-1 bg-brand-accent/20 rounded-full" />
      </div>
    </div>
  );
};

const AdminModal = ({ isOpen, onClose, onAuth }: { isOpen: boolean, onClose: () => void, onAuth: (pass: string) => void }) => {
  const [pass, setPass] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-ink/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-brand-cream p-8 rounded-urban shadow-2xl relative z-10 w-full max-w-md border-4 border-brand-ink"
      >
        <h2 className="text-4xl display mb-6 italic">Admin Access</h2>
        <div className="space-y-4">
          <input 
            type="password" 
            placeholder="Contraseña"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full px-6 py-4 bg-white border-2 border-brand-ink/10 rounded-sm font-bold focus:border-brand-accent outline-none transition-colors"
          />
          <button 
            onClick={() => { onAuth(pass); setPass(''); }}
            className="w-full py-4 bg-brand-ink text-brand-accent font-black uppercase italic tracking-widest hover:bg-brand-accent hover:text-white transition-all"
          >
            Entrar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AddImageForm = ({ onAdd, onCancel }: { onAdd: (data: any) => void, onCancel: () => void }) => {
  const [label, setLabel] = useState('');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beforeFile || !afterFile || !label) return;

    setLoading(true);
    try {
      const beforeRef = ref(storage, `edits/${Date.now()}_before`);
      const afterRef = ref(storage, `edits/${Date.now()}_after`);

      await uploadBytes(beforeRef, beforeFile);
      await uploadBytes(afterRef, afterFile);

      const beforeUrl = await getDownloadURL(beforeRef);
      const afterUrl = await getDownloadURL(afterRef);

      onAdd({ beforeUrl, afterUrl, label });
      setLabel('');
      setBeforeFile(null);
      setAfterFile(null);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Error al subir las imágenes. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-urban shadow-urban border-4 border-brand-ink max-w-2xl mx-auto mb-20"
    >
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-3xl display italic">Nueva Edición</h3>
        <button onClick={onCancel} className="text-brand-ink/40 hover:text-brand-ink transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest opacity-40">Imagen Antes</label>
            <div className="relative h-40 border-2 border-dashed border-brand-ink/10 rounded-sm flex flex-col items-center justify-center hover:border-brand-accent transition-colors cursor-pointer overflow-hidden">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setBeforeFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {beforeFile ? (
                <img src={URL.createObjectURL(beforeFile)} className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload size={24} className="text-brand-ink/20 mb-2" />
                  <span className="text-[10px] font-black uppercase">Subir Antes</span>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest opacity-40">Imagen Después</label>
            <div className="relative h-40 border-2 border-dashed border-brand-ink/10 rounded-sm flex flex-col items-center justify-center hover:border-brand-accent transition-colors cursor-pointer overflow-hidden">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setAfterFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {afterFile ? (
                <img src={URL.createObjectURL(afterFile)} className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload size={24} className="text-brand-ink/20 mb-2" />
                  <span className="text-[10px] font-black uppercase">Subir Después</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest opacity-40">Descripción</label>
          <input 
            type="text" 
            placeholder="Ej: Corrección de color y retoque de piel"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-6 py-4 bg-brand-cream border-2 border-brand-ink/10 rounded-sm font-bold focus:border-brand-accent outline-none transition-colors"
          />
        </div>

        <button 
          type="submit"
          disabled={loading || !beforeFile || !afterFile || !label}
          className="w-full py-4 bg-brand-ink text-brand-accent font-black uppercase italic tracking-widest hover:bg-brand-accent hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
          {loading ? 'Subiendo...' : 'Agregar a la Galería'}
        </button>
      </form>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [images, setImages] = useState<ImageEdit[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const q = query(collection(db, 'images'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Seed initial images if empty
        const seedImages = [
          {
            beforeUrl: "https://picsum.photos/seed/edit1_before/800/600",
            afterUrl: "https://picsum.photos/seed/edit1_after/800/600",
            label: "Corrección de color y eliminación de ruido",
            createdAt: Timestamp.now()
          },
          {
            beforeUrl: "https://picsum.photos/seed/edit2_before/800/600",
            afterUrl: "https://picsum.photos/seed/edit2_after/800/600",
            label: "Retoque de piel y eliminación de objetos",
            createdAt: Timestamp.now()
          }
        ];
        seedImages.forEach(img => addDoc(collection(db, 'images'), img));
      }
      const imgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ImageEdit[];
      setImages(imgs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuth = (pass: string) => {
    if (pass === 'tabito2026') {
      setIsAdmin(true);
      setIsModalOpen(false);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const handleAddImage = async (data: any) => {
    try {
      await addDoc(collection(db, 'images'), {
        ...data,
        createdAt: Timestamp.now()
      });
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding document:", error);
      alert("Error al guardar en la base de datos.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      try {
        await deleteDoc(doc(db, 'images', id));
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-brand-cream">
      <div className="grain" />
      <Navbar onAdminClick={() => setIsModalOpen(true)} />

      {/* Hero Section */}
      <section id="home" className="pt-40 pb-20 flex flex-col items-center justify-center relative overflow-hidden px-6">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            className="relative"
          >
            <h1 className="text-[15vw] md:text-[10vw] display leading-none relative z-10 text-brand-ink">
              GALERÍA
            </h1>
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute -top-10 -right-10 sticker text-xl md:text-3xl px-6 py-2"
            >
              TABITO
            </motion.div>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-brand-ink/60 display italic text-xl md:text-2xl max-w-2xl mx-auto"
          >
            Explora el antes y después de mis trabajos de edición profesional.
          </motion.p>
        </div>
      </section>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-center">
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-3 px-10 py-5 bg-brand-ink text-brand-accent rounded-sm font-black uppercase italic tracking-widest hover:bg-brand-accent hover:text-white transition-all shadow-raw"
            >
              <Plus size={24} />
              Agregar Nueva Imagen
            </button>
          ) : (
            <AddImageForm onAdd={handleAddImage} onCancel={() => setIsAdding(false)} />
          )}
        </div>
      )}

      {/* Gallery Section */}
      <section id="galeria" className="py-20 max-w-7xl mx-auto px-6 space-y-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin text-brand-accent" size={48} />
            <p className="display italic opacity-40">Cargando galería...</p>
          </div>
        ) : images.length > 0 ? (
          images.map((img) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <BeforeAfter 
                before={img.beforeUrl} 
                after={img.afterUrl} 
                label={img.label} 
                isAdmin={isAdmin}
                onDelete={() => handleDelete(img.id)}
              />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-40 space-y-4">
            <Camera size={64} className="mx-auto text-brand-ink/10" />
            <p className="display text-3xl italic opacity-20">No hay imágenes en la galería aún.</p>
          </div>
        )}
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-32 bg-brand-ink text-brand-cream rounded-t-[3rem] relative overflow-hidden mt-40">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-20 relative z-10">
          <div className="space-y-6">
            <h2 className="text-7xl md:text-9xl display leading-none text-brand-accent italic">Hablemos.</h2>
            <div className="sticker text-xl md:text-3xl px-8 py-3">GET IN TOUCH</div>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-10">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-6 px-12 py-8 border-4 border-brand-cream/10 rounded-urban hover:bg-brand-accent hover:text-brand-ink hover:border-brand-accent transition-all group"
            >
              <Instagram size={32} />
              <span className="text-3xl display italic">Instagram</span>
              <ExternalLink size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a 
              href="mailto:contacto@tabito.com" 
              className="flex items-center justify-center gap-6 px-12 py-8 bg-brand-accent text-brand-ink rounded-urban hover:bg-white transition-all group"
            >
              <Mail size={32} />
              <span className="text-3xl display font-black italic">Email Me</span>
              <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
            </a>
          </div>

          <div className="pt-40 flex flex-col md:flex-row justify-between items-center gap-10 border-t-2 border-brand-cream/5 opacity-40 text-xs uppercase tracking-[0.3em] font-black">
            <div className="sticker scale-75 bg-brand-cream/10 text-brand-cream border border-brand-cream/20">© 2026 TABITO STUDIO</div>
            <div className="sticker scale-75 bg-brand-cream/10 text-brand-cream border border-brand-cream/20">HECHO CON PASIÓN</div>
          </div>
        </div>
      </section>

      <AdminModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAuth={handleAuth} 
      />
    </div>
  );
}
