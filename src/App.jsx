import React, { useState } from 'react';
import './App.css';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { supabase } from './supabaseClient';

import { 
  MapPin, 
  Clock, 
  Calendar, 
  Users, 
  CreditCard, 
  FileText, 
  Phone, 
  Mail,
  Bus,
  Camera,
  Shield,
  Heart,
  CheckCircle,
  ArrowRight,
  User,
  X,
  Plus,
  Minus,
  UserPlus,
  Utensils,
  XCircle,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';

// Importando as imagens
import interiorImage1 from './assets/happy1.jpg';
import interiorImage2 from './assets/happy2.jpg';
import jardimImage from './assets/happy3.jpg';

function App() {
  // ⚙️ CONFIGURAÇÃO
  const SERIES_DISPONIVEIS = ['Grupo IV','Grupo V', 'Maternal(3)', 'Maternalzinho(2)', '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'];
  // const SERIES_DISPONIVEIS = ['Grupo IV','Grupo V', 'Maternal(3)', 'Maternalzinho(2)', '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano','6º Ano', '7º Ano', '8º Ano' ,'9º Ano'];

  // ============================================
  // TAXAS DE ANTECIPAÇÃO
  // ============================================
  const TAXA_ANTECIPACAO_VISTA = 0.0115;    // 1,15% - cartão à vista
  const TAXA_ANTECIPACAO_PARCELADO = 0.016; // 1,6% ao mês - parcelado

  const calcularTaxaAntecipacao = (valorBase, numParcelas) => {
    if (numParcelas === 1) {
      return valorBase * TAXA_ANTECIPACAO_VISTA;
    } else {
      const somaMeses = (numParcelas * (numParcelas + 1)) / 2;
      const valorParcela = valorBase / numParcelas;
      return valorParcela * TAXA_ANTECIPACAO_PARCELADO * somaMeses;
    }
  };

  // Estados para o formulário
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    studentGrade: '',
    studentClass: '',
    parentName: '',
    cpf: '',
    email: '',
    phone: '',
    paymentMethod: 'pix',
    installments: 1
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [inscriptionSuccess, setInscriptionSuccess] = useState(false);
  
  // Estados para validação de CPF
  const [cpfError, setCpfError] = useState('');
  const [cpfValid, setCpfValid] = useState(false);

  // Estados para busca de alunos no Supabase
  const [studentSearch, setStudentSearch] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // SEM FILTRO DE TURNO - Todos os alunos (matutino e vespertino)
  const [selectedSerie, setSelectedSerie] = useState('');

  // Função para validar CPF
  const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const showInscricaoForm = () => {
    setShowForm(true);
    setTimeout(() => {
      document.getElementById('formulario-inscricao')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Função para buscar alunos no Supabase - SEM FILTRO DE TURNO (todos participam)
  const searchStudents = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setStudentsList([]);
      setShowStudentDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
    let query = supabase
      .from('alunos')
      .select('*')
      .ilike('nome_completo', `%${searchTerm}%`)
      .in('serie', SERIES_DISPONIVEIS);  // ← usa a lista que você já tem

     // Troque o .not() por .in() com as séries permitidas:
    query = query.in('serie', ['Grupo IV', 'Grupo V', 'Maternal(3)', 'Maternalzinho(2)', '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano']);
      
      // Aplicar filtro de série se selecionado
      if (selectedSerie) {
        query = query.eq('serie', selectedSerie);
      }

      const { data, error } = await query
        .order('nome_completo')
        .limit(10);

      if (error) throw error;
      
      setStudentsList(data || []);
      setShowStudentDropdown(data && data.length > 0);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      setStudentsList([]);
      setShowStudentDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Função para selecionar um aluno
  const selectStudent = (student) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      studentName: student.nome_completo,
      studentGrade: student.serie,
      studentClass: student.turma
    }));
    setStudentSearch(student.nome_completo);
    setShowStudentDropdown(false);
    setStudentsList([]);
  };

  // Função para lidar com mudança no campo de busca
  const handleStudentSearchChange = (e) => {
    const value = e.target.value;
    setStudentSearch(value);
    searchStudents(value);
    
    if (!value) {
      setSelectedStudent(null);
      setFormData(prev => ({
        ...prev,
        studentName: '',
        studentGrade: '',
        studentClass: ''
      }));
      setShowStudentDropdown(false);
    }
  };

  // Limpar seleção de aluno
  const clearStudentSelection = () => {
    setSelectedStudent(null);
    setStudentSearch('');
    setFormData(prev => ({
      ...prev,
      studentName: '',
      studentGrade: '',
      studentClass: ''
    }));
    setShowStudentDropdown(false);
    setStudentsList([]);
  };

  // ============================================
  // CÁLCULO DE PREÇO - R$ 80,00 POR ALUNO
  // Até 3x no cartão com juros
  // ============================================
  const calculatePrice = () => {
    const PRECO_BASE = 80.0;
    let valorTotal = PRECO_BASE;
    
    if (formData.paymentMethod === 'credit') {
      let taxaPercentual = 0;
      const taxaFixa = 0.49;
      const parcelas = parseInt(formData.installments) || 1;
      
      if (parcelas === 1) {
        taxaPercentual = 0.0299;           // 2,99% à vista
      } else if (parcelas >= 2 && parcelas <= 3) {
        taxaPercentual = 0.0349;           // 3,49% de 2 a 3 parcelas
      }
      
      // Taxa do cartão
      const taxaCartao = valorTotal * taxaPercentual;
      
      // Taxa de antecipação
      const taxaAntecipacao = calcularTaxaAntecipacao(valorTotal, parcelas);
      
      // Valor total = base + taxa cartão + taxa fixa + taxa antecipação
      valorTotal = valorTotal + taxaCartao + taxaFixa + taxaAntecipacao;
    }
    
    const valorParcela = valorTotal / (parseInt(formData.installments) || 1);
    return { valorTotal, valorParcela };
  };

  const { valorTotal, valorParcela } = calculatePrice();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cpf') {
      const cpfValue = value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

      setFormData(prev => ({ ...prev, [name]: cpfValue }));
      
      const cpfSemMascara = cpfValue.replace(/[^\d]/g, '');
      
      if (cpfSemMascara.length === 0) {
        setCpfError('');
        setCpfValid(false);
      } else if (cpfSemMascara.length < 11) {
        setCpfError('CPF deve ter 11 dígitos');
        setCpfValid(false);
      } else if (cpfSemMascara.length === 11) {
        if (validarCPF(cpfSemMascara)) {
          setCpfError('');
          setCpfValid(true);
        } else {
          setCpfError('CPF inválido. Verifique os números digitados.');
          setCpfValid(false);
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!selectedStudent) {
      alert('Por favor, selecione um aluno da lista.');
      return false;
    }

    const cpfSemMascara = formData.cpf.replace(/[^\d]/g, '');
    
    if (!cpfSemMascara || cpfSemMascara.length !== 11) {
      alert('Por favor, preencha um CPF válido.');
      return false;
    }
    
    if (!validarCPF(cpfSemMascara)) {
      alert('CPF inválido. Verifique os números digitados.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);

    try {  
      const response = await fetch('https://webhook.escolaamadeus.com/webhook/amadeuseventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentName: formData.studentName,
          studentGrade: formData.studentGrade,
          studentClass: formData.studentClass,
          parentName: formData.parentName,
          cpf: formData.cpf,
          email: formData.email,
          phone: formData.phone,
          paymentMethod: formData.paymentMethod,
          installments: formData.installments,
          ticketQuantity: 1, 
          amount: valorTotal,
          timestamp: new Date().toISOString(),
          event: 'Amadeus-sitiodopicapau'
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Resposta do n8n:', responseData);
        
        if (responseData.success === false) {
          alert(responseData.message || 'Erro ao processar dados. Tente novamente.');
          return;
        }
        
        setInscriptionSuccess(true);
  
        setTimeout(() => {
          if (responseData.paymentUrl) {
            window.location.href = responseData.paymentUrl;
          } else {
            console.log('Link de pagamento não encontrado na resposta');
            alert('Erro: Link de pagamento não encontrado. Entre em contato conosco.');
          }
        }, 1000);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Erro ao enviar dados para o servidor');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao processar inscrição. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (inscriptionSuccess) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Aguarde!</CardTitle>
            <CardDescription>Redirecionando para o pagamento...</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Seus dados foram registrados com sucesso. Em instantes você será redirecionado para finalizar o pagamento.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen smooth-scroll">
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-900">Escola Amadeus</h1>
            <div className="hidden md:flex space-x-6">
              <button onClick={() => scrollToSection('sobre')} className="text-sm hover:text-primary transition-colors">Sobre</button>
              <button onClick={() => scrollToSection('itinerario')} className="text-sm hover:text-primary transition-colors">Informações</button>
              <button onClick={() => scrollToSection('custos')} className="text-sm hover:text-primary transition-colors">Custos</button>
              <button onClick={() => scrollToSection('documentacao')} className="text-sm hover:text-primary transition-colors">Importante</button>
              <button onClick={() => scrollToSection('contato')} className="text-sm hover:text-primary transition-colors">Contato</button>
            </div>
          </div>
        </nav>
      </header>

      <section className="hero-section min-h-screen flex items-center justify-center text-white relative">
        <div className="text-center z-10 max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            O Sítio do Picapau Amarelo
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Espetáculo Teatral no Teatro Alberto Maranhão
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-primary px-8 py-3 bg-white text-primary"
              onClick={() => scrollToSection("sobre")}
            >
              Saiba Mais
            </Button>
          </div>
          <div className="mt-12 flex justify-center items-center space-x-8 text-sm">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <span translate="no">17 de Março de 2026 (Terça-feira)</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Teatro Alberto Maranhão
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="section-padding bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 gradient-text">Sobre o Evento</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            A Companhia Encantada de Teatro, em parceria com o projeto "A Escola Vai ao Teatro", 
            apresentará o clássico musical "O Sítio do Picapau Amarelo" no Teatro Alberto Maranhão. 
            O Sítio do Picapau Amarelo foi criado por Monteiro Lobato com base no folclore brasileiro, 
            na cultura popular e na literatura infantil universal, reunindo personagens do imaginário 
            nacional (como o Saci e a Cuca) e figuras de contos clássicos, integrados a um contexto 
            rural brasileiro.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Uma Experiência Única</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <p>Espetáculo musical clássico da literatura brasileira</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <p>Teatro Alberto Maranhão — um dos mais tradicionais da região</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <p>Transporte de ônibus incluso (ida e volta)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <p>Pipoca inclusa para os alunos</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src={interiorImage1} alt="Evento escolar" className="rounded-lg shadow-lg h-48 w-full object-cover" />         
              <img src={interiorImage2} alt="Atividade cultural" className="rounded-lg shadow-lg h-48 w-full object-cover" />    
              <img src={jardimImage} alt="Passeio escolar" className="rounded-lg shadow-lg col-span-2 h-64 w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section id="itinerario" className="section-padding bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Informações do Evento</h2>
            <p className="text-lg text-muted-foreground">
              Confira todos os detalhes do passeio
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-hover">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Data e Horário</CardTitle>
                <CardDescription translate="no">17 de Março de 2026</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-center" translate="no">
                  Saída da escola às 13h
                </p>
               <p className="text-sm text-center" translate="no">
                  Retorna à escola às 17h
                </p>
                <p className="text-sm text-center font-semibold text-red-600 mt-2">
                  Neste dia NÃO HAVERÁ AULA
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-accent/10 rounded-full w-fit">
                  <MapPin className="h-8 w-8 text-accent" />
                </div>
                <CardTitle>Local</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-center">
                  Teatro Alberto Maranhão
                </p>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Classificação: Livre
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                  <Bus className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Transporte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-center">
                  Ônibus incluso na taxa (ida e volta)
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle>Alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-center">
                  Todos os turnos (matutino e vespertino)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="documentacao" className="section-padding bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">IMPORTANTE - LEIA</h2>
          </div>

          <div className="mt-8 p-6 bg-accent/10 rounded-lg border border-accent/20">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm">
                    Neste dia (<span translate="no">17/03</span>) <strong>NÃO HAVERÁ AULA</strong>. Todos os alunos (matutino e vespertino) deverão estar na escola às <span translate="no">13 horas</span>.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm">
                    O aluno deverá vir com o <strong>FARDAMENTO COMPLETO</strong>, <strong>GARRAFINHA DE ÁGUA</strong> e <strong>LANCHE</strong>. 
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm">
                    A taxa inclui: <strong>entrada no teatro, transporte (ônibus) e pipoca</strong>.
                  </p>
                </div>
              </div>    
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-red-700 font-semibold" translate="no">
                    Pagamento obrigatório até 12/03/2026. Após essa data não será possível estender o prazo.
                  </p>
                </div>
              </div>  
            </div>
          </div>
        </div>
      </section>

      <section id="custos" className="section-padding bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Inscrição e Pagamento</h2>
            <p className="text-lg text-muted-foreground">
              Taxa por aluno — inclui entrada, ônibus e pipoca
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-primary" translate="no">R$ 80,00</CardTitle>
              <CardDescription>por ALUNO</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-accent">O que está incluído:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-accent mr-2" />
                      Entrada no Teatro Alberto Maranhão
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-accent mr-2" />
                      Transporte de ônibus (ida e volta)
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-accent mr-2" />
                      Pipoca
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-destructive">Informações importantes:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <Shield className="h-4 w-4 text-destructive mr-2 mt-0.5" />
                      <span translate="no">Pagamento obrigatório até 12 de março de 2026</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-4 w-4 text-destructive mr-2 mt-0.5" />
                      Após essa data, não será possível estender o prazo
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-4 w-4 text-destructive mr-2 mt-0.5" />
                      Parcelamento em até 3x no cartão (com juros)
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-4 w-4 text-destructive mr-2 mt-0.5" />
                      Após o pagamento, não será  permitido o reembolso. 
                    </li>
                  </ul>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="text-center">
                {!showForm ? (
                  <Button 
                    size="lg" 
                    className="bg-orange-600 hover:bg-orange-700 px-8 py-3"
                    onClick={showInscricaoForm}
                  >
                    Realizar Inscrição e Pagamento
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="px-8 py-3"
                    onClick={() => setShowForm(false)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Fechar Formulário
                  </Button>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {!showForm ? 'Preencha seus dados e escolha a forma de pagamento' : 'Clique acima para fechar o formulário'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* FORMULÁRIO DE INSCRIÇÃO */}
          {showForm && (
            <Card id="formulario-inscricao" className="border-orange-200 bg-orange-50/30">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                  <User className="mr-2 h-5 w-5" />
                  Formulário de Inscrição
                </CardTitle>
                <CardDescription>
                  Preencha todos os dados para garantir a participação do aluno
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* BUSCA DE ALUNO */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Search className="mr-2 h-5 w-5" />
                      Buscar Aluno
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <Label htmlFor="studentSearch">Digite o nome do aluno *</Label>
                        <Input
                          id="studentSearch"
                          name="studentSearch"
                          value={studentSearch}
                          onChange={handleStudentSearchChange}
                          onFocus={() => studentsList.length > 0 && setShowStudentDropdown(true)}
                          required
                          placeholder="Digite pelo menos 2 letras para buscar..."
                          autoComplete="off"
                          className={selectedStudent ? 'border-green-500 bg-green-50' : ''}
                        />
                        
                        {isSearching && (
                          <div className="absolute right-3 top-9">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                        
                        {selectedStudent && (
                          <div className="mt-2 p-3 bg-green-100 rounded border border-green-300 flex items-center justify-between">
                            <div>
                              <span className="text-sm text-green-800 font-medium block">
                                ✓ Aluno selecionado: {selectedStudent.nome_completo}
                              </span>
                              <span className="text-xs text-green-700">
                                {selectedStudent.serie} - Turma {selectedStudent.turma}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearStudentSelection}
                              className="h-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {/* Dropdown de resultados */}
                        {showStudentDropdown && studentsList.length > 0 && !selectedStudent && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {studentsList.map((student) => (
                              <div
                                key={student.id}
                                onClick={() => selectStudent(student)}
                                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                <div className="font-medium text-sm">{student.nome_completo}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {student.serie} - Turma {student.turma}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {studentSearch.length >= 2 && studentsList.length === 0 && !selectedStudent && !isSearching && (
                          <div className="mt-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                            <p className="text-sm text-yellow-800 flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Nenhum aluno encontrado. Verifique o nome digitado.
                            </p>
                          </div>
                        )}

                        {studentSearch.length < 2 && studentSearch.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Digite pelo menos 2 letras para buscar
                          </p>
                        )}
                      </div>

                      {/* Campos preenchidos automaticamente */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="studentGrade">Série do Aluno *</Label>
                          <Input
                            id="studentGrade"
                            name="studentGrade"
                            value={formData.studentGrade}
                            disabled
                            className="bg-gray-100 cursor-not-allowed"
                            placeholder="Será preenchido automaticamente"
                          />
                        </div>
                        <div>
                          <Label htmlFor="studentClass">Turma do Aluno *</Label>
                          <Input
                            id="studentClass"
                            name="studentClass"
                            value={formData.studentClass}
                            disabled
                            className="bg-gray-100 cursor-not-allowed"
                            placeholder="Será preenchido automaticamente"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dados do Responsável */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Mail className="mr-2 h-5 w-5" />
                      Dados do Responsável
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="parentName">Nome do Responsável *</Label>
                        <Input
                          id="parentName"
                          name="parentName"
                          value={formData.parentName}
                          onChange={handleInputChange}
                          required
                          placeholder="Nome completo do responsável"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            placeholder="(84) 99999-9999"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">E-mail *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            placeholder="seu@email.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cpf">CPF do Responsável *</Label>
                          <Input
                            id="cpf"
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleInputChange}
                            required
                            placeholder="000.000.000-00"
                            maxLength="14"
                            className={`${
                              formData.cpf && cpfError 
                                ? 'border-red-500 bg-red-50' 
                                : formData.cpf && cpfValid 
                                ? 'border-green-500 bg-green-50' 
                                : ''
                            }`}
                          />
                          {cpfError && (
                            <p className="text-red-500 text-sm mt-1 flex items-center">
                              <span className="mr-1">⚠️</span>
                              {cpfError}
                            </p>
                          )}
                          {cpfValid && !cpfError && (
                            <p className="text-green-600 text-sm mt-1 flex items-center">
                              <span className="mr-1">✅</span>
                              CPF válido
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Método de Pagamento */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Método de Pagamento*</h3>
                    
                    <div className="space-y-3 mb-6">
                      <div 
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.paymentMethod === 'pix' 
                            ? 'border-orange-400 bg-orange-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'pix', installments: 1 }))}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            formData.paymentMethod === 'pix' ? 'border-orange-400 bg-orange-400' : 'border-gray-300'
                          }`}>
                            {formData.paymentMethod === 'pix' && (
                              <div className="w-full h-full rounded-full bg-orange-400"></div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold">PIX</span>
                            <span className="text-sm" translate="no">
                              R$ 80,00 (sem taxas)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div 
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.paymentMethod === 'credit' 
                            ? 'border-orange-400 bg-orange-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'credit' }))}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            formData.paymentMethod === 'credit' ? 'border-orange-400 bg-orange-400' : 'border-gray-300'
                          }`}>
                            {formData.paymentMethod === 'credit' && (
                              <div className="w-full h-full rounded-full bg-orange-400"></div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">💳</span>
                              <span className="text-sm font-medium">Cartão de Crédito</span>
                            </div>
                            <div className="text-xs text-green-600 ml-6 font-medium">
                              Parcele em até 3x (com juros)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {formData.paymentMethod === 'credit' && (
                      <div className="mb-6">
                        <Label className="text-sm font-medium">Número de Parcelas</Label>
                        <select
                          value={formData.installments}
                          onChange={(e) => setFormData(prev => ({ ...prev, installments: parseInt(e.target.value) }))}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm mt-2"
                        >
                          <option value={1}>1x de R$ {valorTotal.toFixed(2).replace('.', ',')}</option>
                          <option value={2}>2x de R$ {(valorTotal / 2).toFixed(2).replace('.', ',')}</option>
                          <option value={3}>3x de R$ {(valorTotal / 3).toFixed(2).replace('.', ',')}</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          * Taxas de cartão aplicadas ao valor total
                        </p>
                      </div>
                    )}

                    {/* Valor Total */}
                    <div className="bg-orange-100 p-4 rounded-lg border border-orange-200">
                      <div className="text-center" translate="no">
                        <h4 className="text-lg font-bold text-orange-800 mb-1">Valor Total</h4>
                        <div className="text-sm text-gray-600 mb-1">
                          1 aluno × R$ 80,00
                        </div>
                        <div className="text-2xl font-bold text-orange-900">
                          R$ {valorTotal.toFixed(2).replace('.', ',')}
                        </div>
                        {formData.paymentMethod === 'credit' && formData.installments > 1 && (
                          <div className="text-sm text-orange-700 mt-1">
                            {formData.installments}x de R$ {valorParcela.toFixed(2).replace('.', ',')}
                          </div>
                        )}
                        {formData.paymentMethod === 'credit' && (
                          <div className="text-xs text-orange-600 mt-1">
                            (inclui taxas do cartão)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botão de Envio */}
                  <Button 
                    type="submit" 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg font-bold"
                    disabled={isProcessing || !selectedStudent}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando Inscrição...
                      </>
                    ) : (
                      'CONTINUAR PARA PAGAMENTO'
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-600">
                    Ao finalizar, você será redirecionado para o pagamento via Asaas
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section id="contato" className="section-padding bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Entre em Contato</h2>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas conosco
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="card-hover">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Phone className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>Telefone</CardTitle>
                    <CardDescription>Secretaria da escola</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold" translate="no">(84) 9 8145-0229</p>
                <p className="text-sm text-muted-foreground">
                  Horário de atendimento: <span translate="no">7h às 19h</span>
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Coordenação Pedagógica</strong><br />
              Escola Centro Educacional Amadeus - São Gonçalo do Amarante, RN
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-blue-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2026 Escola Centro Educacional Amadeus. Todos os direitos reservados.
          </p>
          <p className="text-xs mt-2 opacity-80" translate="no">
            O Sítio do Picapau Amarelo - Teatro Alberto Maranhão - 17 de Março de 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;


















































