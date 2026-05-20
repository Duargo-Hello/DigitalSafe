
const state = {
user:null,
editing:null
};

function toast(message){

const t = document.createElement('div');

t.className = 'toast';
t.textContent = message;

document.body.appendChild(t);

setTimeout(() => {
t.remove();
},3000);

}

async function hashPassword(password){

const encoder = new TextEncoder();
const data = encoder.encode(password);

const hashBuffer = await crypto.subtle.digest('SHA-256', data);

return Array.from(new Uint8Array(hashBuffer))
.map(b => b.toString(16).padStart(2,'0'))
.join('');

}

function getUsers(){
return JSON.parse(localStorage.getItem('users')) || [];
}

function saveUsers(users){
localStorage.setItem('users',JSON.stringify(users));
}

function sanitize(text){

const div = document.createElement('div');
div.textContent = text;
return div.innerHTML;

}

async function register(){

const username = user.value.trim();
const password = pass.value.trim();

if(!username || !password){
toast('Preencha todos os campos');
return;
}

const users = getUsers();

const exists = users.find(u => u.user === username);

if(exists){
toast('Usuário já existe');
return;
}

const hashed = await hashPassword(password);

users.push({
user:username,
pass:hashed,
itens:[]
});

saveUsers(users);

toast('Cadastro realizado');

user.value='';
pass.value='';

}

async function login(){

const users = getUsers();

const hashed = await hashPassword(pass.value);

const found = users.find(u =>
u.user === user.value &&
u.pass === hashed
);

if(!found){
toast('Usuário ou senha inválidos');
return;
}

state.user = found.user;

localStorage.setItem('session',state.user);

openApp();

}

function openApp(){

auth.classList.add('hidden');
app.classList.remove('hidden');

render();
closeModal();

}

function logout(){

localStorage.removeItem('session');
location.reload();

}

function currentUser(){

const users = getUsers();
return users.find(u => u.user === state.user);

}

function openModal(){

modal.classList.remove('hidden');
state.editing = null;

modalTitle.textContent = 'Novo Registro';

clearForm();

}

function closeModal(){
modal.classList.add('hidden');
}

function clearForm(){

titleInput.value='';
textInput.value='';
categoryInput.value='Projetos';

}

function saveItem(){

const title = titleInput.value.trim();
const text = textInput.value.trim();
const category = categoryInput.value;

if(!title || !text){
toast('Preencha os campos');
return;
}

const users = getUsers();
const user = users.find(u => u.user === state.user);

const item = {
id: state.editing || Date.now(),
titulo:title,
texto:text,
categoria:category,
fav:false,
data:new Date().toISOString()
};

if(state.editing){

const index = user.itens.findIndex(i => i.id === state.editing);

item.fav = user.itens[index].fav;

user.itens[index] = item;

toast('Registro atualizado');

}else{

user.itens.unshift(item);

toast('Registro salvo');

}

saveUsers(users);

render();
closeModal();

}

function render(){

const user = currentUser();
if(!user) return;

const searchValue = search.value.toLowerCase();
const filterValue = filter.value;
const sortValue = sort.value;

let items = [...user.itens];

if(sortValue === 'favorites'){
items = items.filter(i => i.fav);
}

if(sortValue === 'recent'){
items.sort((a,b)=> new Date(b.data) - new Date(a.data));
}

if(sortValue === 'old'){
items.sort((a,b)=> new Date(a.data) - new Date(b.data));
}

if(sortValue === 'az'){
items.sort((a,b)=> a.titulo.localeCompare(b.titulo));
}

items = items.filter(item => {

const searchOk =
item.titulo.toLowerCase().includes(searchValue) ||
item.texto.toLowerCase().includes(searchValue) ||
item.categoria.toLowerCase().includes(searchValue);

const categoryOk =
filterValue === 'Todos' ||
item.categoria === filterValue;

return searchOk && categoryOk;

});

list.innerHTML = '';

if(items.length === 0){

list.innerHTML = `
<div class="card empty">
<h2>Nenhum registro encontrado</h2>
<p>Tente outra pesquisa.</p>
</div>
`;

}

items.forEach(item => {

const card = document.createElement('div');
card.className = 'card item';

card.innerHTML = `
<div class="itemHeader">
<div>
<div class="itemTitle">${sanitize(item.titulo)}</div>
<div class="date">
${new Date(item.data).toLocaleString('pt-BR')}
</div>
</div>

<div class="star" onclick="toggleFavorite(${item.id})">
${item.fav ? '⭐' : '☆'}
</div>
</div>

<div class="badge">
${sanitize(item.categoria)}
</div>

<div class="content">
${sanitize(item.texto)}
</div>

<div class="actions">
<button class="btn" onclick="editItem(${item.id})">
Editar
</button>

<button class="btnSecondary" onclick="duplicateItem(${item.id})">
Duplicar
</button>

<button class="btnDanger" onclick="deleteItem(${item.id})">
Excluir
</button>
</div>
`;

list.appendChild(card);

});

const totalItems = user.itens.length;
const totalFav = user.itens.filter(i => i.fav).length;
const totalCategories = new Set(user.itens.map(i => i.categoria)).size;

total.textContent = totalItems;
favorites.textContent = totalFav;
categories.textContent = totalCategories;

}

function toggleFavorite(id){

const users = getUsers();
const user = users.find(u => u.user === state.user);

const item = user.itens.find(i => i.id === id);

item.fav = !item.fav;

saveUsers(users);
render();

}

function editItem(id){

const user = currentUser();
const item = user.itens.find(i => i.id === id);

if(!item) return;

openModal();

modalTitle.textContent = 'Editar Registro';

state.editing = id;

titleInput.value = item.titulo;
textInput.value = item.texto;
categoryInput.value = item.categoria;

}

function deleteItem(id){

if(!confirm('Deseja excluir este registro?')) return;

const users = getUsers();
const user = users.find(u => u.user === state.user);

user.itens = user.itens.filter(i => i.id !== id);

saveUsers(users);
render();

toast('Registro excluído');

}

function duplicateItem(id){

const users = getUsers();
const user = users.find(u => u.user === state.user);

const item = user.itens.find(i => i.id === id);

const copy = {
...item,
id:Date.now(),
titulo:item.titulo + ' (Cópia)'
};

user.itens.unshift(copy);

saveUsers(users);
render();

toast('Registro duplicado');

}

function exportBackup(){

const user = currentUser();

const data = "data:text/json;charset=utf-8," +
encodeURIComponent(JSON.stringify(user,null,2));

const a = document.createElement('a');

a.href = data;
a.download = 'backup-cofre.json';

a.click();

toast('Backup exportado');

}

window.onclick = e => {
if(e.target === modal){
closeModal();
}
}

window.onload = () => {

const session = localStorage.getItem('session');

if(session){
state.user = session;
openApp();
}

}
