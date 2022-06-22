const express = require('express')
const router = express.Router()
const catchAsync = require('../utils/CatchAsync')
const ExpressError = require('../utils/ExpressError')
const {campgroundSchema} = require('../schemas.js')

const {isLoggedIn} = require('../middleware')
const Campground = require('../models/campground')


const validateCampground = (req, res, next) => {
    const {error} = campgroundSchema.validate(req.body)
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next() 
    }
}

/* Campgrounds Route and fetching all the data from Campground and passing it to ejs files */
router.get('/', catchAsync(async(req, res)=>{
    const campgrounds = await Campground.find({})   
    res.render('campgrounds/index', {campgrounds})
}))
/* Render New.ejs for Creating new Campground */ 
router.get('/new', isLoggedIn, (req, res) => {
    
    res.render('campgrounds/new')
})


/* Post request to Send it to Mongodb and Redirect to it's page */
router.post('/', isLoggedIn, validateCampground, catchAsync(async(req, res, next) => {
        // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400)
        const campground = new Campground(req.body.campground)
        campground.author = req.user._id
        await campground.save()
        req.flash('success', 'Successfully made a new campground')
        res.redirect(`/campgrounds/${campground._id}`)
        next(e)
}))
/* Goto Specific Campground Page. Getting the id and rendering it on website */
router.get('/:id', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews').populate('author')
    // res.render('campgrounds/show', {campground, msg: req.flash("success")})
    if(!campground){
        req.flash('error', 'Cannot Find The Campground')
        res.redirect('/campgrounds')
    }
    res.render('campgrounds/show', {campground})

}))

router.get('/:id/edit', isLoggedIn, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    if(!campground){
        req.flash('error', 'Cannot Find The Campground')
        res.redirect('/campgrounds')
    }

    res.render('campgrounds/edit', {campground})
}))

router.put('/:id', isLoggedIn, validateCampground, catchAsync(async(req,res) => {
    const {id} = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground})
    req.flash('success', 'Successfully Updates Campground')
    res.redirect(`/campgrounds/${campground._id}`)
}))

router.delete('/:id', isLoggedIn, catchAsync(async (req, res) => {
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully Deleted The Campground')
    res.redirect('/campgrounds')
}))

module.exports = router