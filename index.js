/**
 * @fileOverview Główny plik modułu
 * @author Bjornskjald
 * @version 2.1.2
 */

/** Biblioteka crypto-js jest wymagana do "zaszyfrowania" hasła, czego wymaga Portal Edukacyjny przy logowaniu */
const cryptojs = require('crypto-js');

/** Moduł iDziennik używa request-promise-native jako klienta HTTP(S) */
const rp = require('request-promise-native').defaults({followAllRedirects: true});

/** Zmienna "debug" ustawiana jest globalnie, ponieważ logowanie następuje wcześniej niż utworzenie klienta */
var debug

/** Główna funkcja modułu.
 * @function
 * @param {object} object obiekt z danymi przekazywany do funkcji
 * @returns {Client} Klient pobierający dane z API
 * @throws Jeżeli parametr nie jest obiektem, to wyrzuca błąd
 */
function main(object) {
	return new Promise((resolve, reject) => {
		if(typeof object.debug === 'boolean'){
			debug = object.debug
			console.log('Tryb debugowania włączony')
		} else {
			debug = false
		}
		if(typeof object !== 'object'){
			if(debug) console.log('Format ze starej wersji.');
			/** @throws Dane powinny być podane w formie obiektu, a nie są. */
			reject(new Error('Nieprawidłowy format danych.'))
		}
		if(typeof object.username !== 'string' || typeof object.password !== 'string') { // Jeżeli nazwa i hasło nie są stringami
			/*if(typeof object.appstate === 'object'){ // Jeżeli jest podany appstate
				if(debug) console.log('Importuję dane...');
				checkLoggedIn(object.appstate.username, '', object.appstate.jar, object.appstate.id).then(o => {
					resolve(new Client(object.appstate.username, o.jar, object.appstate.id))
				});
			} else {
				reject(new Error('Nieprawidłowy format danych.'))
			}*/
			reject(new Error('Nieprawidłowy format danych.'))
		} else {
			if(debug) console.log('Loguję...')
			checkLoggedIn(object.username, object.password).then(o => {
				resolve(new Client(object.name, o.jar, o.id))
			}).catch(e => {
				reject(e)
			})
		}
	})
}

module.exports = main

/**
 * Główny klient zwracany z funkcji logowania
 * @constructor
 * @param {string} name - nazwa użytkownika
 * @param {object} jar - obiekt zawierający ciastka potrzebne do korzystania z API
 * @param {number} id - numer ID użytkownika
 */
function Client(name, jar, id){
	/** 
	 * Nazwa użytkownika zachowywana do wykonywania żądań do API 
	 * @memberof Client
	 * @type {string}
	 */
	this.name = name;

	/** 
	 * Obiekt z ciastkami potrzebnymi dla klienta HTTP
	 * @memberof Client
	 * @type {object}
	 */
	this.jar = jar;

	/** 
	 * Numer ID użytkownika zachowywany do wykonywania żądań do API
	 * @memberof Client
	 * @type {number}
	 */
	this.id = id;

	/**
	 * Funkcja pobierająca oceny, nie przyjmuje parametrów
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.oceny = () => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/oceny/WS_ocenyUcznia.asmx/pobierzOcenyUcznia',
				body: {idPozDziennika: this.id}, 
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca uwagi
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.uwagi = () => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/uwagi/WS_uwagiUcznia.asmx/pobierzUwagiUcznia',
				body: {idPozDziennika: this.id}, 
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca plan
	 * @function
	 * @memberof Client
	 * @param {Date} date Obiekt daty, na podstawie którego wyznaczane są zastępstwa na dany tydzień
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.plan = (date) => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/plan/WS_Plan.asmx/pobierzPlanZajec',
				body: {idPozDziennika: this.id, data: date, pidRokSzkolny: 16}, 
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca dostępnych odbiorców wiadomości
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.odbiorcy = () => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/pobierzListeOdbiorcow',
				body: {},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca wiadomość
	 * @function
	 * @memberof Client
	 * @param {string} id ID wiadomości
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.wiadomosc = (id) => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/PobierzWiadomosc',
				body: {idWiadomosci: id, typWiadomosci: 0},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca pracowników zewnętrznej jednostki
	 * @function
	 * @memberof Client
	 * @param {number} id ID jednostki
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.pracownicyJednostki = (idjednostki) => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/pobierzPracownikowDlaWybranejJedn',
				body: {idJednostkiNad: idjednostki}, 
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca listę odebranych wiadomości
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.odebrane = () => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/PobierzListeWiadomosci',
				body: {
					param: {
						strona: 1,
						iloscNaStrone: 30,
						iloscRekordow: -1,
						kolumnaSort: "Data_nadania",
						kierunekSort: 1,
						maxIloscZaznaczonych: 0,
						panelFiltrow: 1,
						parametryFiltrow: [{idKolumny:"w.Typ_wiadomosci",paramWartosc:"0"}]
					}
				},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca listę wysłanych wiadomości
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.wyslane = () => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/PobierzListeWiadomosci',
				body: {
					param: {
						strona: 1,
						iloscNaStrone: 30,
						iloscRekordow: -1,
						kolumnaSort: "Data_nadania",
						kierunekSort: 1,
						maxIloscZaznaczonych: 0,
						panelFiltrow: 1,
						parametryFiltrow: [{idKolumny:"w.Typ_wiadomosci",paramWartosc:"1"}]
					}
				},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

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
				.substring(1);
			}
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
		}
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/WyslijWiadomosc',
				body: {
					Wiadomosc: {
						"Tytul": temat,
						"Tresc": tresc,
						"Confirmation": potwierdzenie,
						"GuidMessage": guid(),
						"Odbiorcy": typeof potwierdzenie === 'string' ? [potwierdzenie] : potwierdzenie
					}
				},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca obecności z danego miesiąca
	 * @function
	 * @memberof Client
	 * @param {Date} date Data na podstawie której obliczany jest miesiąc obecności
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.obecnosci = (date) => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/obecnosci/WS_obecnosciUcznia.asmx/pobierzObecnosciUcznia',
				body: {idPozDziennika: this.id, mc: date.getMonth()+1, rok: date.getFullYear(), dataTygodnia: null},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca prace domowe z całego roku szkolnego
	 * @function
	 * @memberof Client
	 * @param {Date} date Data na podstawie której wyznaczany jest rok szkolny
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.praceDomowe = (date) => {
		date.setHours(date.getHours() - date.getTimezoneOffset() / 60);
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/pracaDomowa/WS_pracaDomowa.asmx/pobierzPraceDomowe',
				body: {
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
				},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca treść pracy domowej
	 * @function
	 * @memberof Client
	 * @param {number} id ID pracy domowej
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.pracaDomowa = (id) => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/pracaDomowa/WS_pracaDomowa.asmx/pobierzJednaPraceDomowa',
				body: {idP: this.id, idPD: id},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca sprawdziany z danego miesiąca
	 * @function
	 * @memberof Client
	 * @param {Date} date Data na podstawie której wyznaczany jest miesiąc
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.sprawdziany = (date) => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/sprawdziany/mod_sprawdzianyPanel.asmx/pobierzListe',
				body: {
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
				},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca brakujące oceny z całego roku szkolnego
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.brakujaceOceny = () => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/brak_ocen/WS_BrakOcenUcznia.asmx/pobierzBrakujaceOcenyUcznia',
				body: {idPozDziennika: this.id},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca wydarzenia z całego roku szkolnego
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.wydarzenia = () => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/wwE/WS_wwE.asmx/pobierzWydarzeniaUcznia',
				body: {
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
				},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca terminy wycieczek z całego roku szkolnego
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.wycieczki = () => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/wwE/WS_wwE.asmx/pobierzWycieczkiUcznia',
				body: {
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
				},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca terminy egzaminów z całego roku szkolnego
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.egzaminy = () => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/wwE/WS_wwE.asmx/pobierzOkeUcznia',
				body: {idP: this.id},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja pobierająca listę podręczników na dany rok szkolny
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi pobranymi z API
	 */
	this.podreczniki = () => {
		return new Promise((resolve, reject) => {
			rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/Podreczniki/WS_podreczniki.asmx/pobierzPodreczniki',
				body: {
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
				},
				json: true, method: 'POST',
				jar: this.jar
			}).then(response => {
				resolve(response.d);
			}).catch(err => {
				reject(err);
			})
		})
	};

	/**
	 * Funkcja zwracająca obiekt z danymi klienta
	 * @function
	 * @memberof Client
	 * @returns {object} Obiekt z danymi klienta
	 */
	this.getAppState = () => {
		return {id: this.id, jar: this.jar, name: this.name}
	};
}

/**
 * Funkcja sprawdzająca poprawność podanych danych
 * @function
 * @param {string} name Nazwa użytkownika
 * @param {string} pass Hasło
 * @param {object} importedjar Załadowany obiekt z ciastkami (in-progress)
 * @param {number} importedid Załadowane ID użytkownika (in-progress)
 * @returns {object} Obiekt z danymi do przekazania dla klienta
 * @throws Jeżeli wystąpi błąd w trakcie logowania (np. nieprawidłowe hasło) to zwraca go w postaci klasy Error
 */
function checkLoggedIn(name, pass, importedjar, importedid) {
	return new Promise((resolve, reject) => {
		var jar = typeof importedjar === 'object' ? importedjar : rp.jar()
		var loggedInWithAppState = typeof importedjar === 'object'
		rp({
			uri: 'https://pe.szczecin.pl/chapter_201208.asp?wa=wsignin1.0&wtrealm=https://sisso.pe.szczecin.pl:443/LoginPage.aspx',
			jar: jar, resolveWithFullResponse: true
		}).then(response => {
			if(debug) console.log(response.request.href)
			if(response.request.href === 'https://sisso.pe.szczecin.pl/Default.aspx' || response.body.includes('token" value="')){
				if(debug) console.log('id jest & uzytkownik zalogowany');
				resolve({jar: jar})
				return
			}
			if(loggedInWithAppState){
				reject(new Error('Cookie expired.'))
				return
			}
			if(!response.body.includes('" name="token" value="')){
				if(debug) console.log('Nie mam tokena, probuje pobrac')
				try {
					var formdata = {passworddata: crypto(name, pass, response.body.split('asecretpasswordhash')[2].split('\"')[1]), username: name}
				} catch(err) {
					reject(err)
					return
				}
			} else {
				if(debug) console.log('Mam token, ide dalej')
				var formdata = {}
				try {
					jar.token = response.body.split('token" value')[1].split('\"')[1]
				} catch (err) {
					reject(err)
					return
				}
			}
			return rp({
				uri: 'https://pe.szczecin.pl/chapter_201208.asp',
				method: 'POST', form: formdata, jar: jar
			})
		}).then(body => {
			if(typeof jar.token !== 'string'){
				if(body.includes('504')){
					reject(new Error('Incorrect password.'))
				}
				try {
					jar.token = body.split('token" value')[1].split('\"')[1]
				} catch(err) {
					reject(err)
					return
				}
				if(debug) console.log(jar.token);
			}
			return rp({
				uri: 'https://sisso.pe.szczecin.pl:443/LoginPage.aspx',
				method: 'POST', form: {token: jar.token}, jar: jar
			})
		}).then(body => {
			delete jar.token
			if(!body.includes(name.toUpperCase())){
				reject()
				throw new Error('Failed on logging in.')
			}
			return rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/Oceny.aspx',
				jar: jar
			})
		}).then(body => {
			try {
				var wres = body.split('wresult\" value=\"')[1].split('\"')[0].replace(/&lt;/g, '<').replace(/&quot;/g, '"')
			} catch(err) {
				reject(err)
				return
			}
			return rp({
				uri: 'https://iuczniowie.pe.szczecin.pl/Default.aspx',
				form: {wa: 'wsignin1.0', wresult: wres, wctx: 'rm=0&amp;id=passive&amp;ru=%2fmod_panelRodzica%2fOceny.aspx'},
				method: 'POST', jar: jar, resolveWithFullResponse: true
			})
		}).then(response => {
			if(debug) console.log(response.request.uri.pathname)
			if(response.request.uri.pathname !== '/mod_panelRodzica/Oceny.aspx'){
				reject(new Error('Failed on scraping main page.'))
				return
			}
			if(debug) console.log('Skończyłem pobierać ciastko')
			resolve({jar: jar, id: response.body.split('selected="selected" value="')[1].split('">')[0]})
		})
	})
}



/**
 * Funkcja zwracająca ciąg znaków do zalogowania się
 * @function
 * @param {string} name Nazwa użytkownika
 * @param {string} password Hasło
 * @param {string} hmac Wartość podana przez Portal Edukacyjny
 * @returns {string} Ciąg znaków wymagany do logowania
 */
function crypto(name, password, hmac){
	return cryptojs.HmacMD5(cryptojs.MD5(name.toLowerCase()+password).toString(cryptojs.enc.Hex), hmac).toString(cryptojs.enc.Hex);	
}
