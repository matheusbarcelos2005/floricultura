# Bella Fioritura – Floricultura & Configurador de Buquês Personalizados

Site responsivo de e-commerce desenvolvido para uma floricultura. O sistema gerencia catálogo de produtos, carrinho de compras, checkout, confirmação de pagamento demonstrativa, controle de estoque e painel administrativo de preparação de comandas.

O diferencial principal do projeto é o **Configurador Interativo de Buquês**, que permite ao usuário criar arranjos personalizados escolhendo bases, flores e complementos em tempo real com validação inteligente de regras de compatibilidade física.

---

## 🚀 Como Rodar o Projeto

Como o site foi estruturado para ser leve, direto e de fácil manutenção, ele não necessita de um backend complexo ou banco de dados externo para ser testado.

1. **Execução Direta (Local)**:
   * Basta abrir o arquivo `index.html` em qualquer navegador web dando dois cliques.
   * **Observação**: Para contornar o bloqueio de CORS de requisições de arquivos locais JSON via protocolo `file://`, os scripts possuem carregadores redundantes automáticos que carregam os dados padrão no `localStorage` de forma offline e imediata.
   
2. **Servidor Local de Desenvolvimento (Recomendado)**:
   * Caso tenha o Node.js instalado, você pode abrir o terminal na pasta e rodar:
     ```bash
     npx http-server ./
     ```
     Ou se utilizar Python:
     ```bash
     python -m http-server 8000
     ```
   * Acesse `http://localhost:8080` ou `http://localhost:8000` no seu navegador.

---

## 📂 Estrutura de Pastas

```txt
floricultura-site/
│
├── index.html           # Página inicial (Hero, destaques, depoimentos)
├── produtos.html        # Catálogo de produtos com buscas e filtros
├── carrinho.html        # Visualização do carrinho e edição de quantidade
├── checkout.html        # Checkout com agendamento de entrega e formas de pagamento
├── montar-buque.html    # Configurador interativo passo a passo (Wizard)
├── painel.html          # Painel administrativo da floricultura (pedidos, estoque, estatísticas)
│
├── assets/
│   └── images/
│       └── produtos/    # Imagens reais do catálogo (rosas, girassóis, orquídeas, cestas)
│
├── css/
│   └── style.css        # CSS personalizado (Paleta de cores premium, tipografias e regras de impressão)
│
├── js/
│   ├── main.js          # Inicialização do banco simulado, carrinho global e cabeçalho/rodapé
│   ├── produtos.js      # Lógica de renderização de cards e filtros no catálogo
│   ├── carrinho.js      # Operações de atualização e cálculo de frete
│   ├── checkout.js      # Validação do checkout, confirmação de pagamento e comanda de impressão
│   ├── montar-buque.js  # Regras de limite de hastes, compatibilidade física e desenho dinâmico de flores
│   └── painel.js        # Atualização de pedidos em tempo real, monitor de faturamento e controle de estoque
│
└── data/
    ├── produtos.json    # Banco estático de produtos prontos
    ├── flores.json      # Banco estático de flores do configurador
    ├── vasos.json       # Banco estático de recipientes e suas restrições
    └── complementos.json# Banco estático de mimos (chocolates, cartões, pelúcias)
```

---

## 🛠️ Detalhes de Tecnologia e Regras de Negócio

### 1. Persistência Local
Para salvar dados de pedidos, alterações de status e controle de estoque, o JavaScript utiliza o **`localStorage`** do navegador. Os dados são inicializados automaticamente no primeiro carregamento do site.

### 2. Regras de Compatibilidade (Configurador)
A física do buquê é testada em tempo real no arquivo `js/montar-buque.js`:
* **Vaso de Vidro Pequeno / Embalagem Kraft**: Comporta no máximo **8 / 12 hastes** respectivamente e **bloqueia** flores de tamanho `large` (ex: Girassóis e Lírios Brancos).
* **Vaso de Vidro Médio / Cesta de Vime**: Comporta no máximo **15 / 18 hastes**.
* **Vaso de Vidro Grande / Embalagem Tecido Premium**: Comporta até **25 / 20 hastes** e aceita todas as espécies.
Se o usuário tenta exceder esses limites, um banner de alerta vermelho detalhado é exibido impedindo a adição de mais itens.

### 3. Pagamento e Confirmação
No checkout, ao concluir o formulário:
* **PIX**: Exibe um QR Code demonstrativo e um código para cópia. Um timer de 10 segundos representa a confirmação automática do pagamento, atualizando o pedido para "Pago" em segundo plano.
* **Cartão de Crédito**: Exibe uma tela de processamento seguro por 3 segundos, aprovando a transação em seguida.
O estoque de hastes florais e vasos diminui automaticamente no painel assim que o pagamento é concluído.

### 4. Geração e Impressão de Comanda
No painel e na tela de sucesso do checkout, a equipe pode visualizar a comanda de preparação detalhada. Clicando em "Imprimir", o sistema utiliza folhas de estilo `@media print` para formatar e focar apenas no cupom de fabricação, ideal para impressoras térmicas comuns (não imprime o cabeçalho nem botões do site).

---

## ✍️ Manutenção do Projeto

Qualquer desenvolvedor pode estender o catálogo editando os arquivos na pasta `data/` ou acessando os métodos declarados em `js/main.js`. Toda a marcação HTML segue a semântica do padrão HTML5 (tags `header`, `main`, `section`, `aside` e `footer`) e usa classes responsivas nativas do Bootstrap 5.

---

## Entrega Final

Esta versão está pronta para apresentação e uso demonstrativo em navegador, com fluxo completo de compra, montagem de buquê, estoque e painel administrativo.

Para uso comercial em produção, os próximos passos recomendados são:

* conectar o checkout a uma API real de pagamento, como Pix, cartão ou boleto;
* mover pedidos, estoque e autenticação para um backend com banco de dados;
* proteger o painel administrativo com login de servidor;
* configurar domínio, hospedagem HTTPS e políticas de privacidade.
