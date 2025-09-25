const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'smartvestor.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_smartvestor_secret_change_me';

function ensureDb() {
	if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
	if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ sessions: [], users: [] }, null, 2));
}

function loadDb() {
	ensureDb();
	return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function saveDb(db) {
	fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function generateToken(user) {
	return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}

function auth(req, res, next) {
	const header = req.headers.authorization || '';
	const token = header.startsWith('Bearer ') ? header.slice(7) : null;
	if (!token) return res.status(401).json({ error: 'Unauthorized' });
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = payload;
		next();
	} catch (e) {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

function generateAdvice(input) {
    const { goals = '', budget = 0, risk = 'medium', currency = 'USD', language = 'en' } = input || {};
	const monthlyBudget = Number(budget) || 0;
	const riskLevel = String(risk).toLowerCase();
	const currencyUpper = String(currency || 'USD').toUpperCase();
	const currencySymbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', AUD: 'A$', CAD: 'C$' };
	const symbol = currencySymbols[currencyUpper] || '$';

	const mixByRisk = {
		low: { stocks: 0.25, mutualFunds: 0.35, etfs: 0.25, crypto: 0.0, realEstate: 0.15 },
		medium: { stocks: 0.35, mutualFunds: 0.30, etfs: 0.20, crypto: 0.05, realEstate: 0.10 },
		high: { stocks: 0.45, mutualFunds: 0.20, etfs: 0.15, crypto: 0.15, realEstate: 0.05 }
	};
	const mix = mixByRisk[riskLevel] || mixByRisk.medium;

	const allocations = Object.fromEntries(
		Object.entries(mix).map(([k, v]) => [k, Math.round(monthlyBudget * v)])
	);

	const platforms = {
		stocks: ['Robinhood', 'Fidelity', 'Charles Schwab'],
		mutualFunds: ['Vanguard', 'Fidelity'],
		etfs: ['Vanguard', 'BlackRock iShares'],
		crypto: ['Coinbase', 'Kraken'],
		realEstate: ['Fundrise', 'RealtyMogul']
	};

	const marketsOrLocations = {
		stocks: ['US Large Cap', 'US Mid Cap', 'International Developed'],
		mutualFunds: ['VTSAX (US Total Market)', 'VFIAX (S&P 500)'],
		etfs: ['VTI (Total Market)', 'VXUS (Intl)'],
		crypto: ['BTC', 'ETH'],
		realEstate: ['US Sunbelt metros', 'Logistics/Industrial REITs']
	};

	const fees = {
		stocks: 'Brokerage $0 commissions typical; bid/ask spreads apply.',
		mutualFunds: 'Expense ratios ~0.04%-0.15% for passive funds; avoid loads.',
		etfs: 'Expense ratios ~0.03%-0.15%; minimal tracking error for large funds.',
		crypto: 'Trading fees 0.1%-0.5%; network withdrawal fees vary.',
		realEstate: 'Platform fees 0.15%-1.0%; check advisory and servicing fees.'
	};

	const horizon = {
		stocks: '5+ years recommended to ride market cycles.',
		mutualFunds: '3-5+ years for compounding to work.',
		etfs: '3-5+ years; use core broad-market ETFs.',
		crypto: 'Highly speculative; only for long-term, <10-15% of portfolio.',
		realEstate: 'Illiquid; expect multi-year hold periods.'
	};

    const expectedReturns = {
        low: '4-6%/yr',
        medium: '6-10%/yr',
        high: '10-15%+/yr (volatile)'
    }[riskLevel] || '6-10%/yr';

	const risks = {
		stocks: 'Market risk; diversify across sectors and market caps.',
		mutualFunds: 'Fund management and market risk; check expense ratios.',
		etfs: 'Market risk; low fees; track broad indexes.',
		crypto: 'High volatility and regulatory risk; only invest money you can lose.',
		realEstate: 'Illiquidity; local market cycles; income vacancy risk.'
	};

    const lang = String(language).toLowerCase();
    const t = (en, hi, hin) => lang === 'hi' ? hi : lang === 'hinglish' ? hin : en;

    return {
        inputs: { goals, monthlyBudget, risk: riskLevel, language: lang },
		allocations,
			recommendations: {
            stocks: { amount: allocations.stocks, platforms: platforms.stocks, markets: marketsOrLocations.stocks, note: t(risks.stocks, 'बाज़ार जोखिम; सेक्टर और मार्केट कैप में विविधता रखें.', 'Market risk; sectors aur market cap me diversify karo.'), fees: t(fees.stocks, 'ब्रोकरेज शून्य; स्प्रेड लागत लागू.', 'Brokerage zero; spread cost lagti hai.'), horizon: t(horizon.stocks, '5+ साल; उतार–चढ़ाव के लिए समय दें.', '5+ saal; volatility ke liye time do.'), tip: t('Favor low-cost index exposure first; add sector ETFs selectively.', 'कम-खर्चे वाले इंडेक्स फंड पहले चुनें; सेक्टर ETFs सीमित रूप से जोड़ें.', 'Low-cost index pehle; sector ETFs thoda selective add karo.') },
            mutualFunds: { amount: allocations.mutualFunds, platforms: platforms.mutualFunds, markets: marketsOrLocations.mutualFunds, note: t(risks.mutualFunds, 'फंड व बाज़ार जोखिम; खर्च अनुपात देखें.', 'Fund aur market risk; expense ratio check karo.'), fees: t(fees.mutualFunds, 'खर्च अनुपात ~0.04%-0.15%; लोड से बचें.', 'Expense ratio ~0.04%-0.15%; load se bacho.'), horizon: t(horizon.mutualFunds, '3-5+ साल के लिए रखें.', '3-5+ saal rakhna sahi.'), tip: t('Pick broad passive funds with expense ratios <0.10% when possible.', 'वृहद निष्क्रिय फंड (<0.10% खर्च) चुनें.', 'Broad passive funds (<0.10% expense) choose karo.') },
            etfs: { amount: allocations.etfs, platforms: platforms.etfs, markets: marketsOrLocations.etfs, note: t(risks.etfs, 'बाज़ार जोखिम; कम खर्च, इंडेक्स ट्रैकिंग.', 'Market risk; low fee, index tracking.'), fees: t(fees.etfs, 'खर्च अनुपात ~0.03%-0.15%; ट्रैकिंग त्रुटि कम.', 'Expense ~0.03%-0.15%; tracking error kam.'), horizon: t(horizon.etfs, '3-5+ साल; रिबैलेंस आसान.', '3-5+ saal; rebalance easy.'), tip: t('Use ETFs for tax efficiency and easy rebalancing.', 'टैक्स दक्षता व सरल रिबैलेंस के लिए ETFs बढ़िया.', 'Tax efficiency aur easy rebalance ke liye ETFs best.') },
            crypto: { amount: allocations.crypto, platforms: platforms.crypto, markets: marketsOrLocations.crypto, note: t(risks.crypto, 'उच्च उतार–चढ़ाव व विनियामक जोखिम; सावधानी से निवेश करें.', 'High volatility aur regulatory risk; sirf utna invest jitna lose kar sako.'), fees: t(fees.crypto, 'ट्रेडिंग फीस 0.1%-0.5%; नेटवर्क फीस अलग.', 'Trading fee 0.1%-0.5%; network fee alag.'), horizon: t(horizon.crypto, 'दीर्घकाल; पोर्टफोलियो में छोटा हिस्सा रखें.', 'Long-term; portfolio ka chhota part rakho.'), tip: t('Limit to a small slice; custody on reputable exchanges or hardware wallets.', 'छोटा आवंटन रखें; सुरक्षित कस्टडी/हार्डवेयर वॉलेट.', 'Chhota allocation rakho; safe custody/hardware wallet.') },
            realEstate: { amount: allocations.realEstate, platforms: platforms.realEstate, locations: marketsOrLocations.realEstate, note: t(risks.realEstate, 'तरलता कम; स्थानीय चक्र; किराया जोखिम.', 'Illiquid; local cycles; income vacancy risk.'), fees: t(fees.realEstate, 'प्लेटफ़ॉर्म फीस 0.15%-1.0%; शर्तें देखें.', 'Platform fee 0.15%-1.0%; terms check karo.'), horizon: t(horizon.realEstate, 'मल्टी-ईयर होल्ड; आय व स्थिरता पर फोकस.', 'Multi-year hold; income stability focus.'), tip: t('Prefer diversified income-oriented vehicles; review distribution coverage.', 'विविध आय-उन्मुख साधन चुनें; वितरण कवरेज देखें.', 'Diversified income vehicles choose karo; distribution coverage dekho.') }
		},
		expectedReturns,
		currency: currencyUpper,
		currencySymbol: symbol,
        diversificationTips: [
            t('Dollar-cost average monthly to smooth volatility.', 'मासिक निवेश (DCA) से अस्थिरता कम करें.', 'Monthly DCA se volatility smooth hoti hai.'),
            t('Maintain an emergency fund (3-6 months expenses) before investing.', '3-6 महीनों का आपातकालीन फंड बनाएं.', '3-6 months ka emergency fund pehle banao.'),
            t('Rebalance annually to target allocation.', 'प्रति वर्ष रिबैलेंस करें.', 'Har saal rebalance karo.'),
            t('Favor low-fee index funds/ETFs for core holdings.', 'मुख्य निवेश के लिए कम-खर्चे वाले इंडेक्स/ETF चुनें.', 'Core ke liye low-fee index/ETF choose karo.')
        ]
	};
}

app.get('/api/health', (req, res) => {
	res.json({ ok: true, name: 'SmartVestor' });
});

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
	const { name = '', email = '', password = '' } = req.body || {};
	if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
	const db = loadDb();
	const exists = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
	if (exists) return res.status(409).json({ error: 'User already exists' });
	const id = Date.now().toString();
	const hashed = bcrypt.hashSync(password, 10);
	const user = { id, name, email, password: hashed, createdAt: new Date().toISOString() };
	db.users.push(user);
	saveDb(db);
	const token = generateToken(user);
	res.json({ token, user: { id, name, email } });
});

app.post('/api/auth/login', (req, res) => {
	const { email = '', password = '' } = req.body || {};
	const db = loadDb();
	const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
	if (!user) return res.status(401).json({ error: 'Invalid credentials' });
	const ok = bcrypt.compareSync(password, user.password);
	if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
	const token = generateToken(user);
	res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/auth/me', auth, (req, res) => {
	res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.name } });
});

// Demo Google sign-in (no OAuth; for quick start)
app.post('/api/auth/google-demo', (req, res) => {
	const db = loadDb();
	const email = 'demo.google.user@example.com';
	let user = db.users.find(u => u.email === email);
	if (!user) {
		user = { id: Date.now().toString(), name: 'Google Demo User', email, password: bcrypt.hashSync('google_demo', 10), createdAt: new Date().toISOString() };
		db.users.push(user);
		saveDb(db);
	}
	const token = generateToken(user);
	res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/recommend', (req, res) => {
	try {
		const input = req.body || {};
		const advice = generateAdvice(input);
		const db = loadDb();
		const record = { id: Date.now().toString(), input, advice, createdAt: new Date().toISOString() };
		db.sessions.push(record);
		saveDb(db);
		res.json(record);
	} catch (e) {
		res.status(500).json({ error: 'Failed to generate advice' });
	}
});

// Serve React build if present
const clientBuild = path.join(__dirname, 'client', 'build');
if (fs.existsSync(clientBuild)) {
	app.use(express.static(clientBuild));
	app.get('*', (req, res) => {
		res.sendFile(path.join(clientBuild, 'index.html'));
	});
}

app.listen(PORT, () => {
	console.log(`SmartVestor server running on http://localhost:${PORT}`);
});


