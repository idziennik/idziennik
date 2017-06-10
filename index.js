/**
 * @fileOverview Główny plik modułu
 * @author Bjornskjald
 * @version 4.2.1
 */

/** Biblioteka crypto-js jest wymagana do "zaszyfrowania" hasła, czego wymaga Portal Edukacyjny przy logowaniu */
const cryptojs = require('crypto-js')

/** Moduł iDziennik używa superagent jako klienta HTTP(S) (zmiana z request-promise-native) */
const request = require('superagent')

/** Główna funkcja modułu.
 * @function
 * @param {object} object obiekt z danymi przekazywany do funkcji
 * @returns {Client} Klient pobierający dane z API
 * @throws Jeżeli parametr nie jest obiektem, to wyrzuca błąd
 */
function main(params) {
	return new Promise((resolve, reject) => {
		if(typeof params.debug === 'boolean'){
			var debug = params.debug
			console.log('Tryb debugowania włączony')
		} else {
			var debug = false
		}
		if(typeof params !== 'object'){
			if(debug) console.log('Format ze starej wersji.')
			/** @throws Dane powinny być podane w formie obiektu, a nie są. */
			reject(new Error('Nieprawidłowy format danych.'))
			return
		}
		if(
			(typeof params.username === 'string' && typeof params.password === 'string') || 
			(typeof params.username === 'string' && typeof params.hash === 'string')
		){
			if(debug) console.log('Loguję...')
			checkLoggedIn(params).then(o => {
				resolve(new Client(params.username, o.agent, o.id))
			}).catch(e => {
				reject(e)
			})
		} else {
			reject(new Error('Nieprawidłowy format danych.'))
		}
	})
}

module.exports = main

/**
 * Główny klient zwracany z funkcji logowania
 * @constructor
 * @param {string} name - nazwa użytkownika
 * @param {object} agent - klient HTTPS przekazywany z funkcji logowania
 * @param {number} id - numer ID użytkownika
 */
function Client(name, agent, id){
	/** 
	 * Nazwa użytkownika zachowywana do wykonywania żądań do API 
	 * @memberof Client
	 * @type {string}
	 */
	this.name = name

	/** 
	 * Numer ID użytkownika zachowywany do wykonywania żądań do API
	 * @memberof Client
	 * @type {number}
	 */
	this.id = id

	/** 
	 * Klient HTTPS przekazywany z funkcji logowania
	 * @memberof Client
	 * @type {object}
	 */
	this.agent = agent

	/**
	 * Funkcja pobierająca oceny
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.oceny = () => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/oceny/WS_ocenyUcznia.asmx/pobierzOcenyUcznia')
			.send({idPozDziennika: this.id})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca uwagi
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.uwagi = () => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/uwagi/WS_uwagiUcznia.asmx/pobierzUwagiUcznia')
			.send({idPozDziennika: this.id})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca plan
	 * @function
	 * @memberof Client
	 * @param {Date} date Obiekt daty, na podstawie którego wyznaczane są zastępstwa na dany tydzień
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.plan = (date) => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/plan/WS_Plan.asmx/pobierzPlanZajec')
			.send({idPozDziennika: this.id, data: date, pidRokSzkolny: 16})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca dostępnych odbiorców wiadomości
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.odbiorcy = () => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/pobierzListeOdbiorcow')
			.send({})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			}).catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca wiadomość
	 * @function
	 * @memberof Client
	 * @param {string} id ID wiadomości
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.wiadomosc = (id) => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/PobierzWiadomosc')
			.send({idWiadomosci: id, typWiadomosci: 0})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca pracowników zewnętrznej jednostki
	 * @function
	 * @memberof Client
	 * @param {number} id ID jednostki
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.pracownicyJednostki = (idjednostki) => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/pobierzPracownikowDlaWybranejJedn')
			.send({idJednostkiNad: idjednostki})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			}).catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca listę odebranych wiadomości
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.odebrane = () => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/PobierzListeWiadomosci')
			.send({
				param: {
					strona: 1,
					iloscNaStrone: 65535,
					iloscRekordow: 65535,
					kolumnaSort: "Data_nadania",
					kierunekSort: 1,
					maxIloscZaznaczonych: 0,
					panelFiltrow: 1,
					parametryFiltrow: [{idKolumny:"w.Typ_wiadomosci",paramWartosc:"0"}]
				}
			})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca listę wysłanych wiadomości
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.wyslane = () => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/PobierzListeWiadomosci')
			.send({
				param: {
					strona: 1,
					iloscNaStrone: 65535,
					iloscRekordow: 65535,
					kolumnaSort: "Data_nadania",
					kierunekSort: 1,
					maxIloscZaznaczonych: 0,
					panelFiltrow: 1,
					parametryFiltrow: [{idKolumny:"w.Typ_wiadomosci",paramWartosc:"1"}]
				}
			})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja wysyłająca wiadomość
	 * @function
	 * @memberof Client
	 * @param {string} odbiorca ID odbiorcy
	 * @param {string} temat Temat wiadomości
	 * @param {string} tresc Treść wiadomości
	 * @param {boolean} potwierdzenie Żądanie potwierdzenia przeczytania
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.wyslij = (odbiorca, temat, tresc, potwierdzenie) => {
		function guid() {
			function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1)
			}
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
		}
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/WyslijWiadomosc')
			.send({
				Wiadomosc: {
					"Tytul": temat,
					"Tresc": tresc,
					"Confirmation": potwierdzenie,
					"GuidMessage": guid(),
					"Odbiorcy": typeof odbiorca === 'string' ? [odbiorca] : odbiorca
				}
			})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca obecności z danego miesiąca
	 * @function
	 * @memberof Client
	 * @param {Date} date Data na podstawie której obliczany jest miesiąc obecności
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.obecnosci = (date) => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/obecnosci/WS_obecnosciUcznia.asmx/pobierzObecnosciUcznia')
			.send({idPozDziennika: this.id, mc: date.getMonth()+1, rok: date.getFullYear(), dataTygodnia: null})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca prace domowe z całego roku szkolnego
	 * @function
	 * @memberof Client
	 * @param {Date} date Data na podstawie której wyznaczany jest rok szkolny
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.praceDomowe = (date) => {
		date.setHours(date.getHours() - date.getTimezoneOffset() / 60)
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/pracaDomowa/WS_pracaDomowa.asmx/pobierzPraceDomowe')
			.send({
				param : {
					strona: 1,
					iloscNaStrone: 999,
					iloscRekordow: -1,
					kolumnaSort: "DataOddania",
					kierunekSort: 0,
					maxIloscZaznaczonych: 0,
					panelFiltrow: 0,
					parametryFiltrow: null
				}, 
				idP: this.id, 
				data: date.toJSON().split('T')[0], 
				wszystkie: true 
			})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca treść pracy domowej
	 * @function
	 * @memberof Client
	 * @param {number} id ID pracy domowej
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.pracaDomowa = (id) => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/pracaDomowa/WS_pracaDomowa.asmx/pobierzJednaPraceDomowa')
			.send({idP: this.id, idPD: id})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca sprawdziany z danego miesiąca
	 * @function
	 * @memberof Client
	 * @param {Date} date Data na podstawie której wyznaczany jest miesiąc
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.sprawdziany = (date) => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/sprawdziany/mod_sprawdzianyPanel.asmx/pobierzListe')
			.send({
				param: {
					strona: 1,
					iloscNaStrone: 99,
					iloscRekordow: -1,
					kolumnaSort: "ss.Nazwa,sp.Data_sprawdzianu",
					kierunekSort: 0,
					maxIloscZaznaczonych: 0,
					panelFiltrow: 0,
					parametryFiltrow: null
				}, 
				idP: this.id, 
				miesiac: (date.getMonth()+1).toString(), 
				rok: date.getFullYear().toString()
			})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca brakujące oceny z całego roku szkolnego
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.brakujaceOceny = () => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/brak_ocen/WS_BrakOcenUcznia.asmx/pobierzBrakujaceOcenyUcznia')
			.send({idPozDziennika: this.id})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca wydarzenia z całego roku szkolnego
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.wydarzenia = () => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/wwE/WS_wwE.asmx/pobierzWydarzeniaUcznia')
			.send({
				param: {
					strona: 1,
					iloscNaStrone: 999, 
					iloscRekordow: -1,
					kolumnaSort: "Data",
					kierunekSort: 1,
					maxIloscZaznaczonych: 0,
					panelFiltrow: 0,
					parametryFiltrow: null
				},
				idP: this.id
			})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca terminy wycieczek z całego roku szkolnego
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.wycieczki = () => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/wwE/WS_wwE.asmx/pobierzWycieczkiUcznia')
			.send({
				param: {
					strona: 1,
					iloscNaStrone: 999, 
					iloscRekordow: -1,
					kolumnaSort: "Data",
					kierunekSort: 1,
					maxIloscZaznaczonych: 0,
					panelFiltrow: 0,
					parametryFiltrow: null
				},
				idP: this.id
			})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca terminy egzaminów z całego roku szkolnego
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.egzaminy = () => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/wwE/WS_wwE.asmx/pobierzOkeUcznia')
			.send({idP: this.id})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja pobierająca listę podręczników na dany rok szkolny
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.podreczniki = () => {
		return new Promise((resolve, reject) => {
			this.agent
			.post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/Podreczniki/WS_podreczniki.asmx/pobierzPodreczniki')
			.send({
				param: {
					strona: 1,
					iloscNaStrone: 999, 
					iloscRekordow: -1,
					kolumnaSort: "Nazwa",
					kierunekSort: 0,
					maxIloscZaznaczonych: 0,
					panelFiltrow: 0,
					parametryFiltrow: null
				},
				idP: this.id
			})
			.then(response => {
				resolve(JSON.parse(response.text).d)
			})
			.catch(err => {
				reject(err)
			})
		})
	}

	/**
	 * Funkcja zwracająca obiekt z danymi klienta
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi klienta
	 */
	this.getAppState = () => {
		return {id: this.id, agent: this.agent, name: this.name}
	}
}

/**
 * Funkcja sprawdzająca poprawność podanych danych
 * @function
 * @param {object} params Parametry logowania
 * @returns {object} Obiekt z danymi do przekazania dla klienta
 * @throws Jeżeli wystąpi błąd w trakcie logowania (np. nieprawidłowe hasło) to zwraca go w postaci klasy Error
 */
function checkLoggedIn(params) {
	// {name, pass, agent, id, hash, debug}
	return new Promise((resolve, reject) => {
		if(params.debug) var debug = true

		if(debug) console.log('Pobieram ciastko...')

		var loggedInWithAppState = typeof params.agent === 'object'
		var agent = typeof params.agent === 'object' ? params.agent : request.agent()

		var token

		agent
		.get('https://pe.szczecin.pl/chapter_201208.asp?wa=wsignin1.0&wtrealm=https://sisso.pe.szczecin.pl:443/LoginPage.aspx')
		.then(response => {
			if(debug) console.log(response.request.url)
			if(
				response.request.url === 'https://sisso.pe.szczecin.pl/Default.aspx' || 
				(response.text.includes('token" value="') && typeof params.id === 'number')
			){
				if(debug) console.log('id jest & uzytkownik zalogowany')
				resolve({agent: agent, id: params.id})
				return
			}
			if(loggedInWithAppState){
				throw new Error('Cookie expired.')
				return
			}
			if(!response.text.includes('" name="token" value="')){
				if(debug) console.log('Nie mam tokena, probuje pobrac')
				try {
					if(typeof params.hash === 'string'){
						if(debug) console.log('Loguje sie hashem')
						var formdata = {passworddata: crypto(params.hash, response.text.split('asecretpasswordhash')[2].split('\"')[1]), username: params.username}
					} else {
						if(debug) console.log('Loguje sie haslem')
						var formdata = {passworddata: crypto(cryptojs.MD5(params.username.toLowerCase()+params.password).toString(cryptojs.enc.Hex), response.text.split('asecretpasswordhash')[2].split('\"')[1]), username: params.username}
					}
				} catch(err) {
					throw err
				}
			} else {
				if(debug) console.log('Mam token, ide dalej')
				var formdata = {}
				try {
					token = response.text.split('token" value')[1].split('\"')[1]
				} catch (err) {
					throw err
				}
			}
			return agent
			.post('https://pe.szczecin.pl/chapter_201208.asp')
			.type('form')
			.send(formdata)
		}).then(response => {
			if(debug) console.log('Stage 2')
			if(typeof token !== 'string'){
				if(response.text.includes('504')){
					throw new Error('Incorrect password.')
				}
				try {
					token = response.text.split('token" value')[1].split('\"')[1]
				} catch(err) {
					throw err
				}
			}
			return agent
			.post('https://sisso.pe.szczecin.pl:443/LoginPage.aspx')
			.type('form')
			.send({token: token})
		}).then(response => {
			if(debug) console.log('Stage 3')
			token = ''
			if(!response.text.includes(params.username.toUpperCase()) && !response.text.includes(params.username.toLowerCase())){
				console.log(JSON.stringify(response))
				throw new Error('Failed on logging in')
			}
			return agent
			.get('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/Oceny.aspx')
		}).then(response => {
			if(debug) console.log('Stage 4')
			if(response.request.url === "https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/Oceny.aspx" && !response.text.includes('Working...')){
				resolve({agent: agent, id: response.text.split('selected="selected" value="')[1].split('">')[0]})
			}
			try {
				var wres = response.text.split('wresult\" value=\"')[1].split('\"')[0].replace(/&lt;/g, '<').replace(/&quot;/g, '"')
			} catch(err) {
				throw err
			}
			return agent
			.post('https://iuczniowie.pe.szczecin.pl/Default.aspx')
			.type('form')
			.send({wa: 'wsignin1.0', wresult: wres, wctx: 'rm=0&amp;id=passive&amp;ru=%2fmod_panelRodzica%2fOceny.aspx'})
		}).then(response => {
			if(debug) console.log('Stage 5')
			if(debug) console.log(response.request.url)
			if(response.request.url !== 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/Oceny.aspx'){
				/* throw new Error('Failed on scraping main page.')
				return */
				return agent.get('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/Oceny.aspx')
			}
			if(debug) console.log('Skończyłem pobierać ciastko')
			resolve({agent: agent, id: response.text.split('selected="selected" value="')[1].split('">')[0]})
		}).then(response => {

			if(response.request.url !== 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/Oceny.aspx'){
				throw new Error('Failed on scraping main page.')
				return
			}
			resolve({agent: agent, id: response.text.split('selected="selected" value="')[1].split('">')[0]})
		}).catch(err => {
			reject(err)
			return
		})
	})
}



/**
 * Funkcja zwracająca ciąg znaków do zalogowania się
 * @function
 * @param {string} md5 Hash MD5 wygenerowany z nazwy użytkownika i hasła
 * @param {string} hmac Wartość podana przez Portal Edukacyjny
 * @returns {string} Ciąg znaków wymagany do logowania
 */
function crypto(md5, hmac){
	return cryptojs.HmacMD5(md5, hmac).toString(cryptojs.enc.Hex)
}
