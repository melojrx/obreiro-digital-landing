
import React, { useState } from 'react';
import { Check, Users, BarChart3, QrCode, Cloud, Building, Star, Menu, X, ArrowRight, Play } from 'lucide-react';

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('profissional');

  const features = [
    {
      icon: Building,
      title: "Gestão Multi-Filial",
      description: "Controle todas as suas unidades em um só lugar com visão unificada e relatórios consolidados."
    },
    {
      icon: Users,
      title: "Membros & Visitantes",
      description: "Cadastro completo com rastreamento de conversão e histórico detalhado de engajamento."
    },
    {
      icon: BarChart3,
      title: "Analytics Avançado",
      description: "Relatórios e métricas de crescimento em tempo real com insights acionáveis."
    },
    {
      icon: QrCode,
      title: "QR Code Inteligente",
      description: "Cadastro automático de visitantes via QR Code - pioneiro no mercado brasileiro."
    },
    {
      icon: Cloud,
      title: "API Completa",
      description: "Integre com qualquer sistema via REST API robusta e bem documentada."
    },
    {
      icon: Cloud,
      title: "100% Cloud",
      description: "Acesse de qualquer lugar, seguro, escalável e sempre atualizado."
    }
  ];

  const pricing = [
    {
      name: "Básico",
      price: "49",
      period: "/mês",
      popular: false,
      features: [
        "1 Igreja, 3 Filiais",
        "Até 500 membros",
        "Dashboard básico",
        "QR Code visitantes",
        "Suporte por email"
      ]
    },
    {
      name: "Profissional",
      price: "99",
      period: "/mês",
      popular: true,
      features: [
        "1 Igreja, 10 filiais",
        "Até 2.000 membros",
        "Analytics completo",
        "API básica (50k calls/mês)",
        "Suporte prioritário"
      ]
    },
    {
      name: "Enterprise",
      price: "199",
      period: "/mês",
      popular: false,
      features: [
        "Filiais ilimitadas",
        "Membros ilimitados",
        "API completa (200k calls/mês)",
        "Integrações customizadas",
        "Suporte 24/7 + SLA"
      ]
    }
  ];

  const testimonials = [
    {
      name: "Pastor João Silva",
      church: "Igreja Batista Central",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      text: "O Obreiro Digital transformou nossa gestão. Agora conseguimos acompanhar o crescimento da igreja com dados precisos."
    },
    {
      name: "Pr. Maria Santos",
      church: "Igreja Assembleia de Deus",
      image: "https://images.unsplash.com/photo-1494790108755-2616b332e1e8?w=400&h=400&fit=crop&crop=face",
      text: "A facilidade de cadastrar visitantes com QR Code revolucionou nossa recepção. Recomendo para todas as igrejas."
    },
    {
      name: "Adm. Carlos Oliveira",
      church: "Igreja Presbiteriana",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      text: "Interface moderna e intuitiva. Nossa equipe se adaptou rapidamente e os relatórios são incríveis."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-slate-800">
                <span className="text-blue-800">Obreiro</span>
                <span className="text-fuchsia-600">Digital</span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#home" className="text-slate-600 hover:text-blue-800 font-medium transition-colors">Home</a>
              <a href="#recursos" className="text-slate-600 hover:text-blue-800 font-medium transition-colors">Recursos</a>
              <a href="#precos" className="text-slate-600 hover:text-blue-800 font-medium transition-colors">Preços</a>
              <a href="#contato" className="text-slate-600 hover:text-blue-800 font-medium transition-colors">Contato</a>
              <a href="#api" className="text-slate-600 hover:text-blue-800 font-medium transition-colors">API</a>
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-blue-800 hover:text-blue-900 font-semibold px-4 py-2 rounded-lg transition-colors">
                Fazer Login
              </button>
              <button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors shadow-lg">
                Criar Conta Grátis
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <nav className="flex flex-col space-y-4">
                <a href="#home" className="text-slate-600 hover:text-blue-800 font-medium">Home</a>
                <a href="#recursos" className="text-slate-600 hover:text-blue-800 font-medium">Recursos</a>
                <a href="#precos" className="text-slate-600 hover:text-blue-800 font-medium">Preços</a>
                <a href="#contato" className="text-slate-600 hover:text-blue-800 font-medium">Contato</a>
                <a href="#api" className="text-slate-600 hover:text-blue-800 font-medium">API</a>
                <div className="flex flex-col space-y-2 pt-4">
                  <button className="text-blue-800 hover:text-blue-900 font-semibold px-4 py-2 rounded-lg text-left">
                    Fazer Login
                  </button>
                  <button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold px-4 py-2 rounded-lg">
                    Criar Conta Grátis
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-br from-blue-50 via-white to-fuchsia-50 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gray-100 opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6 mb-12 lg:mb-0">
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight">
                Modernize a <span className="text-blue-800">Gestão da Sua Igreja</span> com 
                <span className="text-fuchsia-600"> Tecnologia de Ponta</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Plataforma completa para gestão de membros, visitantes e relatórios analíticos. 
                Com QR Code para captação e API REST para integrações.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button className="border-2 border-blue-800 text-blue-800 hover:bg-blue-800 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 flex items-center justify-center">
                  <Play className="mr-2 h-5 w-5" />
                  Ver Demonstração
                </button>
              </div>
              <div className="mt-12 flex items-center space-x-8 text-sm text-slate-600">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  14 dias grátis
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  Sem compromisso
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  Suporte incluído
                </div>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                  <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop"
                    alt="Dashboard Preview" 
                    className="w-full h-auto rounded-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-2xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-800 mb-2">500+</div>
              <div className="text-slate-600">Igrejas Confiam</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-fuchsia-600 mb-2">50.000+</div>
              <div className="text-slate-600">Membros Cadastrados</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-800 mb-2">98%</div>
              <div className="text-slate-600">Satisfação dos Clientes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-800 mb-6">
              Recursos que <span className="text-blue-800">Transformam</span> sua Igreja
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Tecnologia de ponta desenvolvida especialmente para as necessidades das igrejas brasileiras
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                  <div className="bg-gradient-to-br from-blue-50 to-fuchsia-50 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-blue-800" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-800 mb-6">
              Dashboard <span className="text-fuchsia-600">Moderno</span> e Intuitivo
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Interface limpa e poderosa que coloca todos os dados importantes na palma da sua mão
            </p>
          </div>
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl p-4 lg:p-8">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop"
                alt="Dashboard Interface" 
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-800 mb-6">
              Planos que <span className="text-blue-800">Cabem</span> no seu Orçamento
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Preços justos e transparentes para igrejas de todos os tamanhos
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricing.map((plan, index) => (
              <div key={index} className={`relative ${plan.popular ? 'transform scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-fuchsia-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      MAIS POPULAR
                    </div>
                  </div>
                )}
                <div className={`bg-white border-2 ${plan.popular ? 'border-fuchsia-600 shadow-xl' : 'border-gray-100'} rounded-3xl p-8 h-full`}>
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">{plan.name}</h3>
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-4xl font-bold text-slate-800">R$ {plan.price}</span>
                      <span className="text-slate-600 ml-2">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    plan.popular 
                      ? 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                      : 'border-2 border-blue-800 text-blue-800 hover:bg-blue-800 hover:text-white'
                  }`}>
                    Começar Teste Gratuito
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-800 mb-6">
              O que os <span className="text-fuchsia-600">Líderes</span> Dizem
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-slate-800">{testimonial.name}</h4>
                    <p className="text-slate-600 text-sm">{testimonial.church}</p>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-800 to-fuchsia-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Comece Sua Transformação Digital Hoje
          </h2>
          <p className="text-xl text-blue-100 mb-12">
            Junte-se a centenas de igrejas que já modernizaram sua gestão com o Obreiro Digital
          </p>
          <div className="bg-white rounded-2xl p-8 max-w-md mx-auto">
            <form className="space-y-4">
              <input 
                type="text" 
                placeholder="Nome da Igreja"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 focus:border-transparent outline-none"
              />
              <input 
                type="email" 
                placeholder="Email do Responsável"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 focus:border-transparent outline-none"
              />
              <input 
                type="tel" 
                placeholder="Telefone"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 focus:border-transparent outline-none"
              />
              <button className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Começar Agora - 14 Dias Grátis
              </button>
            </form>
            <div className="flex justify-center space-x-6 mt-6 text-sm text-slate-600">
              <span>✓ 14 dias grátis</span>
              <span>✓ Sem compromisso</span>
              <span>✓ Suporte incluído</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">
                <span className="text-blue-400">Obreiro</span>
                <span className="text-fuchsia-400">Digital</span>
              </div>
              <p className="text-slate-400 mb-4">
                Modernizando a gestão eclesiástica com tecnologia de ponta.
              </p>
              <div className="text-slate-400">
                <p>📧 contato@obreirodigital.com.br</p>
                <p>📞 (11) 3000-0000</p>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#recursos" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#precos" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#api" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Suporte</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#contato" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Treinamentos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Obreiro Digital. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
