import prisma from '../config/prisma.js'

export const getCategories = async (req, res) => {
  try {
    console.log('USER ID:', req.userId)

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { is_default: true },
          { user_id: req.userId }
        ]
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(categories)

    res.json(categories)
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Failed to get categories'
    })
  }
}

export const createCategory = async (req, res) => {
  try {
    const {
      name,
      type,
      icon,
      color
    } = req.body

    const category = await prisma.category.create({
      data: {
        user_id: req.userId,
        name,
        type,
        icon,
        color,
        is_default: false
      }
    })

    res.status(201).json(category)
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Failed to create category'
    })
  }
}