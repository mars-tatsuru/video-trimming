import express from 'express'
import { BoardsModel } from '../models/boardsModels'

const boardsModel = new BoardsModel()

export class BoardsController {
  async getAllBoards(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) {
    try {
      const rows = await boardsModel.getAllBoards()
      response.json(rows)
    } catch (error: any) {
      next(error)
    }
  }

  async getBoardById(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) {
    const boardId = request.params.id
    try {
      const rows = await boardsModel.getBoardById(boardId)
      response.json(rows)
    } catch (error: any) {
      next(error)
    }
  }

  async createBoard(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) {
    const { name, board_order } = request.body
    try {
      const result = await boardsModel.createBoard(name, board_order)
      response.json(result)
    } catch (error: any) {
      next(error)
    }
  }

  async updateBoard(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) {
    const { id } = request.params
    const { name, board_order } = request.body
    try {
      const result = await boardsModel.updateBoard(id, name, board_order)
      response.json(result)
    } catch (error: any) {
      next(error)
    }
  }

  async deleteBoard(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) {
    const { id } = request.params
    try {
      const result = await boardsModel.daleteBoard(id)
      response.json(result)
    } catch (error: any) {
      next(error)
    }
  }
}
