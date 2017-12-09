module.exports = function (date) {
  return new Promise((resolve, reject) => {
    this.agent
    .post('https://iuczniowie.pe.szczecin.pl/mod_panelRodzica/obecnosci/WS_obecnosciUcznia.asmx/pobierzObecnosciUcznia')
    .send({idPozDziennika: this.id, mc: date.getMonth() + 1, rok: date.getFullYear(), dataTygodnia: null})
    .then(response => {
      resolve(JSON.parse(response.text).d)
    })
    .catch(err => {
      reject(err)
    })
  })
}