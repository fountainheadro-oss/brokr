export const STADIU_OPTIONS = ["Active - Hot"];
export const TRANZACTIE_OPTIONS = ["Inchiriere", "Vanzare"];
export const CATEGORIA_OPTIONS = [
  "Apartament",
  "Casa/Vila", 
  "Teren", 
  "Spatiu Birou", 
  "Spatiu Comercial", 
  "Spatiu Industrial", 
  "Hotel/Pensiune", 
  "Proprietati Speciale"
];

export const ILFOV_LOCALITIES = [
  "Afumati", "1 Decembrie", "Balotesti", "Berceni", "Branesti", "Buftea", 
  "Cernica", "Chiajna", "Chitila", "Ciolpani", "Ciorogarla", "Clinceni", 
  "Copaceni", "Corbeanca", "Cornetu", "Dascalu", "Darasti-Ilfov", "Domnesti", 
  "Dragomiresti-Vale", "Ganeasa", "Glina", "Gradistea", "Gruiu", "Jilava", 
  "Moara Vlasiei", "Magurele", "Mogosoaia", "Nuci", "Otopeni", "Pantelimon", 
  "Petrachioaia", "Popesti-Leordeni", "Peris", "Snagov", "Stefanestii de Jos", 
  "Tunari", "Vidra", "Voluntari"
];

export const ORAS_OPTIONS = ["Bucuresti", ...ILFOV_LOCALITIES, "Altul"];

export const ZONA_OPTIONS = [
  "1 Decembrie 1918", "1 Mai", "13 Septembrie", "16 Februarie", "23 August (Catelul)", "Agronomie", "Alba Iulia", "Alexandriei", "Alexandru Obregia", 
  "Amzei", "Andronache", "Antiaeriana", "Aparatorii Patriei", "Apusului", "Arcul de Triumf", "Armeneasca", "Aviatiei", "Aviatorilor", "Baba Novac", 
  "Baicului", "Balta Alba", "Baneasa", "Banu Manta", "Barbu Vacarescu", "Basarab", "Basarabia", "Batistei", "Bd. Gloriei", "Bd. Laminorului", 
  "Beller", "Berceni", "Brancoveanu", "Brezoianu", "Bucur Obor", "Bucurestii Noi", "Calea Calarasilor", "Calea Plevnei", "Calea Victoriei", 
  "Camil Ressu", "Campia Libertatii", "Candiano Popescu", "Cantemir", "Capitale", "Casin", "Central", "Centrul Civic", "Centrul Istoric", 
  "Centura Est", "Centura Nord", "Centura Sud", "Centura Vest", "Chibrit", "Chirigii", "Chisinau", "Chitila", "Cismigiu", "Clabucet", 
  "Clucerului", "Colentina", "Compozitorilor", "Constructorilor", "Cosbuc", "Costin Georgian", "Cotroceni", "Crangasi", "Crevedia", 
  "Cutitul de Argint", "Dacia", "Damaroaia", "Decebal", "DN 1", "DN 2", "Doamna Ghica", "Domenii", "Dorobanti", "Dristor", "Drumul Gazarului", 
  "Drumul Sarii", "Drumul Taberei", "Dudesti", "Eminescu", "Eroii Revolutiei", "Est", "Exterior Est", "Exterior Nord", "Exterior Sud", 
  "Exterior Vest", "Ferdinand", "Ferentari", "Fizicienilor", "Floreasca", "Foisorul de Foc", "Fundeni", "Gara de Est", "Gara de Nord", 
  "Ghencea", "Giulesti", "Giulesti Sarbi", "Giurgiului", "Gorjului", "Gradina Icoanei", "Grivita", "Grozavesti", "Herastrau", "I.C. Bratianu", 
  "Iancu Nicolae", "Iancului", "Industriilor", "Ion Creanga", "Jiului", "Kiseleff", "Kogalniceanu", "Lacul Morii", "Lacul Tei", "Lahovari", 
  "Libertatii", "Lipscani", "Liviu Rebreanu", "Lizeanu", "Lucretiu Patrascanu", "Lujerului", "Magheru", "Magurele", "Marasesti", "Margeanului", 
  "Matei Voievod", "Metalurgiei", "Mihai Bravu", "Militari", "Mitropolie", "Moinesti", "Morarilor", "Mosilor", "Muncii", "Natiunile Unite", 
  "Nerva Traian", "Nicolae Grigorescu", "Nord", "Nord-Est", "Nord-Vest", "Nordului", "Obor", "Octavian Goga", "Oltenitei", "Ozana", 
  "P-ta Alba Iulia", "P-ta Amzei", "P-ta Arsenalului", "P-ta de Gros", "P-ta Dorobanti", "P-ta Galati", "P-ta Gorjului", "P-ta Jose Rizal", 
  "P-ta Leul", "P-ta Muncii", "P-ta Operei", "P-ta Presei Libere", "P-ta Resita", "P-ta Romana", "P-ta Rosetti", "P-ta Sfanta Vineri", 
  "P-ta Sfantul Gheorghe", "P-ta Sfantul Stefan", "P-ta Sfintii Voievozi", "P-ta Unirii", "P-ta Universitatii", "P-ta Victoriei", 
  "Pache Protopopescu", "Pacii", "Pajura", "Panduri", "Pantelimon", "Parcul Carol", "Parcul Circului", "Periferie", "Petricani", 
  "Pieptanari", "Pipera", "Plevnei", "Politehnica", "Polona", "Prelungirea Ferentari", "Prelungirea Ghencea", "Primaverii", "Progresul", 
  "Rahova", "Regie", "Regina Elisabeta", "Romana", "Rosetti", "Sala Palatului", "Salaj", "Salajan", "Sebastian", "Serban Voda", 
  "Sisesti", "Socului", "Soseaua Nordului", "Splaiul Independentei", "Splaiul Unirii", "Stefan cel Mare", "Stirbei Voda", "Straulesti", 
  "Sud", "Sud-Est", "Sud-Vest", "Sura Mare", "Take Ionescu", "Tei", "Teiul Doamnei", "Televiziune", "Theodor Pallady", "Timisoara", 
  "Timpuri Noi", "Tineretului", "Titan", "Titulescu", "Trafic Greu", "Tudor Vladimirescu", "Turda", "Ultracentral", "Unirii", 
  "Universitate", "Uverturii", "Vacaresti", "Valea Ialomitei", "Valea Oltului", "Vasile Parvan", "Vatra Luminoasa", "Vest", "Veteranilor", 
  "Victoriei", "Viilor", "Virtutii", "Vitan", "Vitan Mall", "Vitan-Barzesti", "Vitanul Nou", "Zetarilor"
];

export const TIP_APARTAMENT_OPTIONS = ["Apartament", "Garsoniera", "Penthouse"];
export const COMPARTIMENTARE_OPTIONS = ["Decomandat", "Semidecomandat", "Nedecomandat", "Circular", "Comandat", "Duplex", "Open space"];
export const CONFORT_OPTIONS = ["1", "2", "3", "Lux"];
export const DESTINATIE_OPTIONS = ["Birouri", "Comerciala", "De vacanta"];
export const ETAJ_OPTIONS = [
  "Demisol", "Parter", 
  ...Array.from({ length: 24 }, (_, i) => `Etaj ${i + 1}`),
  "Mansarda", "Ultimele 2 etaje"
];
export const ORIENTARE_OPTIONS = ["Nord", "Nord-Est", "Est", "Sud-Est", "Sud", "Sud-Vest", "Vest", "Nord-Vest", "Nord-Sud", "Est-Vest", "Mixt"];

export const STADIU_CONSTRUCTIE_OPTIONS = ["Finalizata", "In constructie", "Proiect", "Finisat", "Semifinisat", "La rosu", "Necesita renovare", "De demolat", "Structura"];
export const TIP_IMOBIL_OPTIONS = ["Bloc", "Casa/Vila", "Bloc garsoniere", "Bloc Mixt"];
export const STRUCTURA_OPTIONS = ["Caramida", "Beton", "BCA", "Placi", "Lemn", "Metal", "Altele", "Porotherm"];
export const TIP_SPATIU_COMERCIAL_OPTIONS = ["Spatiu comercial", "Birou", "Hala / Depozit", "Retail", "Showroom", "Depozit", "Retail / Showroom", "Hala", "Altele"];
export const RISC_SEISMIC_OPTIONS = ["-", "Clasa I", "Clasa II", "Clasa III", "Clasa IV", "Urgenta 1", "Urgenta 2", "Urgenta 3"];
export const CLASA_ENERGETICA_OPTIONS = ["", "A", "B", "C", "D", "E", "F", "G"];

export const IMPREJURIMI_OPTIONS = [
  "Scoli", "Zone verzi", "Farmacii", "Restaurante", "Transport", 
  "Zone comerciale", "Metrou", "Sali de sport", "Cafenele", "Cantina", "Banci"
];
