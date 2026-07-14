import Favorite from '../models/Favorite.js';

// @desc    Get user's favorites
// @route   GET /api/favorites
// @access  Private
export const getFavorites = async (req, res, next) => {
  try {
    const { folder, type, search, tags } = req.query;
    
    const query = { user: req.user._id };
    
    if (folder) query.folder = folder;
    if (type) query.type = type;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const favorites = await Favorite.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      favorites,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's distinctive folders
// @route   GET /api/favorites/folders
// @access  Private
export const getFolders = async (req, res, next) => {
  try {
    const folders = await Favorite.distinct('folder', { user: req.user._id });
    
    res.status(200).json({
      success: true,
      folders: folders.length > 0 ? folders : ['Uncategorized'],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new favorite
// @route   POST /api/favorites
// @access  Private
export const addFavorite = async (req, res, next) => {
  try {
    const { name, type, folder, tags, data } = req.body;

    const favorite = await Favorite.create({
      user: req.user._id,
      name,
      type,
      folder: folder || 'Uncategorized',
      tags: tags || [],
      data
    });

    res.status(201).json({
      success: true,
      message: 'Added to favorites',
      favorite
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a favorite
// @route   PUT /api/favorites/:id
// @access  Private
export const updateFavorite = async (req, res, next) => {
  try {
    const { name, folder, tags } = req.body;
    
    let favorite = await Favorite.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    if (name) favorite.name = name;
    if (folder !== undefined) favorite.folder = folder;
    if (tags) favorite.tags = tags;

    await favorite.save();

    res.status(200).json({
      success: true,
      message: 'Favorite updated',
      favorite
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a favorite
// @route   DELETE /api/favorites/:id
// @access  Private
export const deleteFavorite = async (req, res, next) => {
  try {
    const favorite = await Favorite.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    
    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Favorite removed'
    });
  } catch (error) {
    next(error);
  }
};
