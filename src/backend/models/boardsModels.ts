import mysql from 'mysql2/promise'

require('dotenv').config()

const dbConnect = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 100
})

export class BoardsModel {
  async getAllBoards() {
    const [rows] = await dbConnect.execute('select * from Boards order by board_order ')
    return rows
  }

  async getBoardById(id: string) {
    const [rows] = await dbConnect.execute('select * from Boards where id = ? ', [id])
    return rows
  }

  async createBoard(name: string, board_order: number) {
    const [result] = await dbConnect.execute('insert into Boards set name = ?,board_order = ?  ', [
      name,
      board_order
    ])
    return result
  }

  async updateBoard(id: string, name: string, board_order: number) {
    const [result] = await dbConnect.execute(
      'update Boards set name = ?, board_order = ? where id = ?',
      [name, board_order, id]
    )
    return result
  }

  async daleteBoard(id: string) {
    const [result] = await dbConnect.execute('delete from Boards where id = ?', [id])
    return result
  }
}
