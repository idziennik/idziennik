const 	fs = require('fs'),
		cryptojs = require('crypto-js');

const debug = false; // Jeżeli chcesz włączyć dodatkowe informacje zmień "false" na "true"

var data = {},
	skiptoken = false;

const rp = require('request-promise').defaults({followAllRedirects: true});

module.exports = {
	login: (name, pass) => {
		return new Promise((resolve, reject) => {
			if(typeof name !== 'string' || typeof pass !== 'string') {
				reject('Nieprawidłowa nazwa użytkownika/hasło');
				return;
			}
			if(data.hasOwnProperty(name)) {
				if(debug) console.log('User istnieje');
				if(typeof data[name].jar === 'undefined') {
					if(debug) console.log('Tworze userowi ciasteczka')
					data[name].jar = rp.jar();
				}
				if(data[name].hasOwnProperty('pass') && pass === data[name].pass) {
					resolve()
				} else {
					reject('Nieprawidłowa nazwa użytkownika/hasło')
				}
			} else {
				if(debug) console.log('User nie istnieje');
				data[name] = {pass: pass};
				if(typeof data[name].jar === 'undefined') {
					if(debug) console.log('Tworze userowi ciasteczka')
					data[name].jar = rp.jar();
				}
				checkLoggedIn(name, pass).then(result => {
					if(result.status === 'success'){
						resolve()
					} else {
						delete data[name]
						reject('Nieprawidłowa nazwa użytkownika/hasło')
					}
				})
			}
		})
	},
	oceny: (name, pass) => {
		return new Promise((resolve, reject) => {
			if(debug) console.log('Pobieram oceny...');
			if(userExists(name, pass)){
				reject('Use idziennik.login first.')
				return
			}
			checkLoggedIn(name, pass).then(() => {
				if(debug) console.log('Jest ciastko, pobieram...')
				rp({
					uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/oceny/WS_ocenyUcznia.asmx/pobierzOcenyUcznia',
					body: {idPozDziennika: data[name].id}, 
					json: true, method: 'POST',
					jar: data[name].jar
				}).then(response => {
					resolve(response);
				}).catch(err => {
					reject(err);
				})
			})
		})
	},
	uwagi: (name, pass) => {
		return new Promise((resolve, reject) => {
			if(userExists(name, pass)){
				reject('Use idziennik.login first.')
				return
			}
			checkLoggedIn(name, pass).then(() => {
				rp({
					uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/uwagi/WS_uwagiUcznia.asmx/pobierzUwagiUcznia',
					body: {idPozDziennika: data[name].id}, 
					json: true, method: 'POST',
					jar: data[name].jar
				}).then(response => {
					resolve(response);
				}).catch(err => {
					reject(err);
				})
			})
		})
	},
	plan: (name, pass, date) => {
		return new Promise((resolve, reject) => {
			if(userExists(name, pass)){
				reject('Use idziennik.login first.')
				return
			}
			checkLoggedIn(name, pass).then(() => {
				rp({
					uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/plan/WS_Plan.asmx/pobierzPlanZajec',
					body: {idPozDziennika: data[name].id, data: date, pidRokSzkolny: 16}, 
					json: true, method: 'POST',
					jar: data[name].jar
				}).then(response => {
					resolve(response);
				}).catch(err => {
					reject(err);
				})
			})
		})
	},
	odbiorcy: (name, pass) => {
		return new Promise((resolve, reject) => {
			if(userExists(name, pass)){
				reject('Use idziennik.login first.')
				return
			}
			checkLoggedIn(name, pass).then(() => {
				rp({
					uri: 'https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/pobierzListeOdbiorcow',
					body: {},
					json: true, method: 'POST',
					jar: data[name].jar
				}).then(response => {
					resolve(response);
				}).catch(err => {
					reject(err);
				})
			})
		})
	},
	wiadomosc: (name, pass, id) => {
		return new Promise((resolve, reject) => {
			if(userExists(name, pass)){
				reject('Use idziennik.login first.')
				return
			}
			checkLoggedIn(name, pass).then(() => {
				rp({
					uri: 'https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/PobierzWiadomosc',
					body: {idWiadomosci: id, typWiadomosci: 0},
					json: true, method: 'POST',
					jar: data[name].jar, resolveWithFullResponse: true
				}).then(response => {
					resolve({status: 'success', data: response.body});
				}).catch(err => {
					reject(err);
				})
			})
		})
	},
	pracownicyJednostki: (name, pass, idjednostki) => {
		return new Promise((resolve, reject) => {
			if(userExists(name, pass)){
				reject('Use idziennik.login first.')
				return
			}
			checkLoggedIn(name, pass).then(() => {
				rp({
					uri: 'https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/pobierzPracownikowDlaWybranejJedn',
					body: {idJednostkiNad: idjednostki}, json: true, method: 'POST',
					jar: data[name].jar, resolveWithFullResponse: true
				}).then(response => {
					resolve({status: 'success', data: response.body});
				}).catch(err => {
					reject(err);
				})
			})
		})
	},
	odebrane: (name, pass) => {
		return new Promise((resolve, reject) => {
			if(userExists(name, pass)){
				reject('Use idziennik.login first.')
				return
			}
			checkLoggedIn(name, pass).then(() => {
				rp({
					uri: 'https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/PobierzListeWiadomosci ',
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
					jar: data[name].jar, resolveWithFullResponse: true
				}).then(response => {
					resolve(response.body);
				}).catch(err => {
					reject(err);
				})
			})
		})
	},
	wyslane: (name, pass) => {
		return new Promise((resolve, reject) => {
			if(userExists(name, pass)){
				reject('Use idziennik.login first.')
				return
			}
			checkLoggedIn(name, pass).then(() => {
				rp({
					uri: 'https://iuczniowie.pe.szczecin.pl/mod_komunikator/WS_wiadomosci.asmx/PobierzListeWiadomosci ',
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
					jar: data[name].jar, resolveWithFullResponse: true
				}).then(response => {
					resolve(response.body);
				}).catch(err => {
					reject(err);
				})
			})
		})
	},
	getData: () => {
		return data;
	},
	loadData: (loadedData) => {
		if(typeof loadedData === 'object' && JSON.stringify(data) === '{}'){
			data = loadedData;
		} else {
			throw new Error('Błąd ładowania danych.')
		}
	}
}

function crypto(name, password, hmac){
	return cryptojs.HmacMD5(cryptojs.MD5(name.toLowerCase()+password).toString(cryptojs.enc.Hex), hmac).toString(cryptojs.enc.Hex);	
}

function getValidCookie(name, pass, lastbody){
	if(debug) console.log('name: '+name)
	if(debug) console.log('pass: '+pass)
	return new Promise((resolve, reject) => {
		if(!lastbody.includes('" name="token" value="')){
			if(debug) console.log('Nie mam tokena, probuje pobrac')
			try {
				var formdata = {passworddata: crypto(name, pass, lastbody.split('asecretpasswordhash')[2].split('\"')[1]), username: name}
			}
			catch(err) {
				console.error(err);
				reject('Failed on 1st step.')
				return
			}
		} else {
			if(debug) console.log('Mam token, ide dalej')
			var formdata = {}
			data[name].token = lastbody.split('token" value')[1].split('\"')[1]
			skiptoken = true
		}

		rp({
			uri: 'https://pe.szczecin.pl/chapter_201208.asp',
			method: 'POST', form: formdata, jar: data[name].jar
		}).then(body => {
			if(!skiptoken){
				try {
					if(typeof body.split('token\" value')[1] === 'undefined'){
						//data[name].pass = ''
						//console.log(body)
						if(body.includes('504')) console.log('Nieprawidłowe hasło.')
						reject('Failed on login. (token undefined)')
						return
					}
					data[name].token = body.split('token" value')[1].split('\"')[1]
				}
				catch(err){
					console.error(err)
					reject('Failed on login. (unknown error)')
					return
				}
			} else {
				skiptoken = false;
			}
			rp({
				uri: 'https://sisso.pe.szczecin.pl:443/LoginPage.aspx',
				method: 'POST', form: {token: data[name].token}, jar: data[name].jar
			}).then(body => {
				if(!body.includes(name.toUpperCase())){
					reject('Failed on login. (2nd step)')
					return
				}
				rp({
					uri: 'https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/Oceny.aspx',
					jar: data[name].jar
				}).then(body => {
					try {
						var wres = body.split('wresult\" value=\"')[1].split('\"')[0].replace(/&lt;/g, '<').replace(/&quot;/g, '"')
					}
					catch(err){
						console.error(err)
						reject('Failed on Sisso redirect.')
						return
					}
					rp({
						uri: 'https://iuczniowie.pe.szczecin.pl/Default.aspx',
						form: {wa: 'wsignin1.0', wresult: wres, wctx: 'rm=0&amp;id=passive&amp;ru=%2fmod_panelRodzica%2fOceny.aspx'},
						method: 'POST', jar: data[name].jar, resolveWithFullResponse: true
					}).then(response => {
						if(debug) console.log(response.request.uri.pathname)
						if(response.request.uri.pathname !== '/mod_panelRodzica/Oceny.aspx'){
							reject('Failed on scraping main page.')
							return
						}
						data[name].id = response.body.split('selected="selected" value="')[1].split('">')[0]
						resolve()
					})
				})
			})
		})
	})
}

function checkLoggedIn(name, pass){
	return new Promise((resolve, reject) => {
		rp({
			uri: 'https://pe.szczecin.pl/chapter_201208.asp?wa=wsignin1.0&wtrealm=https://sisso.pe.szczecin.pl:443/LoginPage.aspx',
			jar: data[name].jar, resolveWithFullResponse: true
		}).then(response => {
			if(debug) console.log(response.request.href)
			if(typeof data[name].id !== 'undefined' && response.request.href === 'https://sisso.pe.szczecin.pl/Default.aspx' || response.body.includes('token" value="')){
				if(debug) console.log('id jest & uzytkownik zalogowany');
				resolve({status: 'success'})
			} else {
				getValidCookie(name, pass, response.body).then(() => {
					if(debug) console.log('No, mam to ciastko');
					resolve({status: 'success'})
				}).catch(error => {
					if(debug) console.log('Jakis blad, ciastka nie ma.')
					if(debug) console.log('blad: '+error)
					resolve({status: 'error', data: error})
				})
			}
		})
	})
}

function userExists(name, pass){
	if(typeof name !== 'string' || typeof pass !== 'string' || !data.hasOwnProperty(name) || !data[name].hasOwnProperty('pass') || !data[name].hasOwnProperty('jar')){
		return true
	} else {
		return false
	}
}