import express, { response } from 'express'
import { BoardsController } from './controllers/boardsController'
import cors from 'cors'

require('dotenv').config()

const app: express.Express = express()
const port = 3000

const boardsController = new BoardsController()

app.use(express.json())
app.use(cors())

app.listen(port, () => {
  console.log('起動' + port)
})

app.get('/', (request: express.Request, response: express.Response) => {
  response.send('HTTPリクエスト確認')
})

app.get('/boards', boardsController.getAllBoards)
app.get('/boards/:id', boardsController.getBoardById)
app.post('/boards', boardsController.createBoard)
app.put('/boards/:id', boardsController.updateBoard)
app.delete('/boards/:id', boardsController.deleteBoard)

app.use(
  (
    error: any,
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    console.error(error)
    response.status(500).send('エラーが発生しました。')
  }
)
