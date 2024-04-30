'use strict'

const indexedDBKeys = {
  dbName: 'facebookTimeLimit',
  obStoreName: 'infoToCheckTimeLimit',
  keyPath: 'info',
}
const messages = {
  m1: 'Nhập vào số phút sử dụng fb trong ngày',
  m2: 'Nhập không hợp lệ, bạn phải nhập số và phải lớn hơn 0',
  m3: 'Bạn không còn được sử dụng fb trong ngày hôm nay nữa, hẹn bạn vào ngày mai, mãi yêuuuu !!!',
}
const request = window.indexedDB.open(indexedDBKeys.dbName, 3)

request.onupgradeneeded = event => {
  const db = event.target.result
  // Tạo đối tượng lưu trữ nếu chưa tồn tại
  if (!db.objectStoreNames.contains(indexedDBKeys.obStoreName)) {
    db.createObjectStore(indexedDBKeys.obStoreName, { keyPath: 'key' })
  }
}

request.onerror = event => {
  // Do something with request.errorCode!
  console.error(`Database error: ${event.target.errorCode}`)
}

// cho người dùng nhập thời gian
const inputTimes = () => {
  let times

  while (true) {
    times = Number(window.prompt(messages.m1))

    if (isNaN(times) || times < 1) {
      window.alert(messages.m2)
    } else {
      break
    }
  }

  return { times: times * 60, date: new Date() }
}

// update vào indexedDB
const update = (result, db) => {
  const transaction = db.transaction(indexedDBKeys.obStoreName, 'readwrite')
  const store = transaction.objectStore(indexedDBKeys.obStoreName)

  const data = {
    ...result,
    timeCount: result.timeCount,
  }
  store.put(data)
}

// không cho sử dụng
const lock = () => {
  alert(messages.m3)
  window.location.href = 'https://www.google.com.vn/?hl=vi'
}

// đếm
const countTime = (result, db) => {
  const intervalId = window.setInterval(() => {
    if (result.timeCount-- <= 0) {
      // trường hợp tới hạn, không cho sử dụng nữa
      lock()
      window.clearInterval(intervalId)
    } else {
      // cập nhật vào indexedDB
      update(result, db)
    }
  }, 1000)
}

const isNewDate = date => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  return date.getTime() < now.getTime()
}

// thực hiện đếm
const doCountTime = (result, db) => {
  const { timeCount, date } = result

  if (timeCount > 0) {
    // trường hợp vẫn còn thời gian, tiếp tục đếm
    countTime(result, db)
  } else if (isNewDate(date)) {
    // trường hợp qua ngày mới, cho người dùng nhập lại
    const { times, date } = inputTimes()

    const newData = {
      key: indexedDBKeys.keyPath,
      timeCount: times,
      date: date,
    }

    countTime(newData, db)
  } else {
    // trường hợp quá hạn trong ngày, không có sử dụng nữa
    lock()
  }
}

// start ở hàm này
request.onsuccess = event => {
  const db = event.target.result

  // Tạo giao dịch
  const transaction = db.transaction(indexedDBKeys.obStoreName, 'readwrite')
  const store = transaction.objectStore(indexedDBKeys.obStoreName)

  // Lấy dữ liệu
  const getRequest = store.get(indexedDBKeys.keyPath)
  getRequest.onsuccess = () => {
    let result = getRequest.result

    if (!result) {
      // chưa có thì khởi tạo 1 cái để lưu
      const { times, date } = inputTimes()

      result = {
        key: indexedDBKeys.keyPath,
        timeCount: times,
        date: date,
      }
      store.put(result)
    }

    // bắt đầu thực hiện đếm
    doCountTime(result, db)
  }
}
