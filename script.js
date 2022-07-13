const BASE_URL = 'https://lighthouse-user-api.herokuapp.com'
const INDEX_URL = BASE_URL + '/api/v1/users/'
const USERS_PER_PAGE = 20

const users = []
let filteredUsers = []
let currentPage = 1
let maxPage = 1
let closeFriendsList = JSON.parse(localStorage.getItem('CloseFriends')) || []
let listedId = []

const dataPanel = document.querySelector('#data-panel')
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')
const paginator = document.querySelector('#paginator')

function renderUserList(userData) {
  let rawHTML = ''
  getIdFromList(closeFriendsList)
  // name, surname, avatar
  userData.forEach(function(item) {
    rawHTML += `
      <div class='card m-2' style='width: 13rem'>
        <img src='${item.avatar}' class='card-img-top' alt='card-img' data-bs-toggle='modal' data-bs-target='#user-modal' data-id='${item.id}' >
        <button class='btn-sm btn-outline-danger add-close-friends ${listedId.includes(item.id) ? "active" : "" }' data-bs-toggle='button' data-id='${item.id}'><i class='fa-solid fa-heart add-close-friends' data-id='${item.id}'></i></button>
        <div class='card-body' data-bs-toggle='modal' data-bs-target='#user-modal' data-id='${item.id}'>
          <h5 class='card-text' data-id='${item.id}'>${item.name} ${item.surname}</h5>
        </div>
      </div>`
  })
  dataPanel.innerHTML = rawHTML
}

function renderPaginator(amount) {
  //計算總頁數
  const numberOfPages = Math.ceil(amount / USERS_PER_PAGE)
  maxPage = numberOfPages
  let rawHTML = `
    <li class='page-item'>
      <a class='page-link page-previous' href='#' aria-label='Previous'>
        <span aria-hidden='true' class='page-previous'>&laquo;</span>
      </a>
    </li>`
  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `
      <li class='page-item ${page === currentPage ? "active" : ""}'>
        <a class='page-link' href='#' data-page='${page}'>${page}</a>
      </li>`
    // 方法二
    // if (page === 1) {
    //   rawHTML += `
    //   <li class='page-item active' id='pagination-${page}'><a class='page-link' href='#' data-page='${page}'>${page}</a></li>`
    // } else {
    //   rawHTML += `
    //   <li class='page-item' id='pagination-${page}'><a class='page-link' href='#' data-page='${page}'>${page}</a></li>`
    // }    
  }
  rawHTML += `
    <li class='page-item'>
      <a class='page-link page-next' href='#' aria-label='Next'>
        <span aria-hidden='true' class='page-next'>&raquo;</span>
      </a>
    </li>`
  paginator.innerHTML = rawHTML;
}

function getUsersByPage(page) {
  // page 1 -> users 0 - 39
  // page 2 -> users 40 - 79
  const data = filteredUsers.length ? filteredUsers : users
  //計算起始 index
  const startIndex = (page - 1) * USERS_PER_PAGE
  //回傳切割後的新陣列
  return data.slice(startIndex, startIndex + USERS_PER_PAGE)
}

function showUserModal(id) {
  const modalTitle = document.querySelector('#user-modal-title');
  const modalImage = document.querySelector('#user-modal-image');
  const modalDescription = document.querySelector('#user-modal-description');
  // 先將 modal 內容清空，以免出現上一個 user 的資料殘影
  modalTitle.innerText = '';
  modalImage.src = '';
  modalDescription.innerText = '';

  axios
    .get(INDEX_URL + id)
    .then((response) => {
      const userData = response.data;
      modalTitle.innerText = userData.name + ' ' + userData.surname;
      modalImage.src = userData.avatar;
      modalDescription.innerHTML = `
    <p>email: ${userData.email}</p>
    <p>gender: ${userData.gender}</p>
    <p>age: ${userData.age}</p>
    <p>region: ${userData.region}</p>
    <p>birthday: ${userData.birthday}</p>`;
    })
    .catch((err) => console.log(err));
}

function addToOrRemoveCloseFriends(id) {
  // 請 find 去總表中查看，找出 id 相同的人回傳，暫存在 user
  const user = users.find((user) => user.id === id)  
  
  if(!closeFriendsList.some((user) => user.id === id)) {
    // 把user推進摯友名單
    closeFriendsList.push(user)
    alert('加入摯友名單中!')
  } else {
    // filter: 篩選符合的 -> id相同的從摯友清單移除
    closeFriendsList = closeFriendsList.filter(function listFiltered(listItem) {
      if (listItem.id !== id) {
        return listItem
      }
    })
    alert('從摯友名單中移除!')
  }
  // 接著呼叫 localStorage.setItem，把更新後的收藏清單同步到 local stroage
  localStorage.setItem('CloseFriends', JSON.stringify(closeFriendsList)) 
}

function getIdFromList(list) {
  list.forEach((listItem) => {
    listedId.push(listItem.id)
  })
}

paginator.addEventListener('click', function onPaginatorClicked(event) {
  // 方法二
  // 1. currentpage => parent => <li> => remove class active
  // let varId = '#pagination-' + currentPage
  // document.querySelector(varId).classList.remove('active')
  
  if(event.target.matches('.page-previous')) {
    if (currentPage <= 1) return 
    currentPage = currentPage - 1
  } else if(event.target.matches('.page-next')) {
    if (currentPage >= maxPage) return
    currentPage = currentPage + 1
  } else {
    //透過 dataset 取得被點擊的頁數
    const page = Number(event.target.dataset.page)
    currentPage = page
  }
  
  // 方法二
  // 2. currentpage => parent => <li> => add class active
  // let newVarId = '#pagination-' + currentPage
  // document.querySelector(newVarId).classList.add('active')

  renderUserList(getUsersByPage(currentPage))
  if(filteredUsers.length === 0) {
    renderPaginator(users.length)
  } else {
    renderPaginator(filteredUsers.length)
  }  
})

dataPanel.addEventListener('click', function onPanelClicked(event) {
  showUserModal(Number(event.target.dataset.id))

  if(event.target.matches('.add-close-friends')) {
    addToOrRemoveCloseFriends(Number(event.target.dataset.id))
  }
})

searchForm.addEventListener('submit', function onSearchFormSubmitted(event) {
  //取消預設事件
  event.preventDefault();
  //取得搜尋關鍵字
  const keyword = searchInput.value.trim().toLowerCase()
  filteredUsers = users.filter((user) => 
    user.name.toLowerCase().includes(keyword) || user.surname.toLowerCase().includes(keyword))
  //錯誤處理：無符合條件的結果
  if(filteredUsers.length === 0) {
    return alert('找不到下列使用者:' + keyword)
  }
  console.log(filteredUsers)
  //重製分頁器
  currentPage = 1
  renderPaginator(filteredUsers.length)
  //預設顯示第 1 頁的搜尋結果
  renderUserList(getUsersByPage(1))
})

axios
  .get(INDEX_URL)
  .then((response) => {
    users.push(...response.data.results)
    renderPaginator(users.length)
    renderUserList(getUsersByPage(1))
  })
  .catch((err) => console.log(err))