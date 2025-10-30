import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Youtube, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'About', href: '/about' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Features', href: '#features' },
      { label: 'Documentation', href: '/docs' },
    ],
    company: [
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Support', href: '/support' },
      { label: 'Privacy', href: '/privacy' },
    ],
    legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Compliance', href: '/compliance' },
    ],
  };

  const socialLinks = [
    {
      icon: Linkedin,
      href: 'https://linkedin.com/company/lytbuB',
      label: 'LinkedIn',
    },
    {
      icon: Youtube,
      href: 'https://youtube.com/@lytbuB',
      label: 'YouTube',
    },
    {
      icon: MessageCircle,
      href: 'https://discord.gg/lytbuB',
      label: 'Discord',
    },
  ];

  return (
    <footer className="bg-gradient-to-br from-cosmic-dark via-cosmic-light/5 to-cosmic-dark border-t border-cosmic-light/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cosmic-accent to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-white font-bold text-xl">LytbuB</span>
            </div>
            <p className="text-cosmic-accent text-sm leading-relaxed">
              The comprehensive AI operating system that transforms how businesses operate,
              automate, and grow in the digital age.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-cosmic-accent">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>hello@lytbuB.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-cosmic-accent hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-cosmic-accent hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-cosmic-accent hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="py-6 border-t border-cosmic-light/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Social Icons */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cosmic-accent hover:text-white transition-colors p-2 rounded-lg hover:bg-cosmic-light/10"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-cosmic-accent text-sm">
              © {currentYear} LytbuB. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};













