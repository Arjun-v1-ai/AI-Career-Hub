const mongoose = require("mongoose");
const { z } = require("zod");
const { Schema } = mongoose;

// Zod Schemas
const SkillSchema = z.string().min(1).trim();

const SkillScoreSchema = z.object({
  skill: z.string().min(1).trim(),
  score: z.number().min(0).max(100),
});

// New Comment Schema for forum posts
const CommentSchema = z.object({
  content: z.string().min(1).max(2000).trim(),
  author: z.string(), // User ID
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  likes: z.array(z.string()).optional(), // Array of user IDs who liked the comment
  replies: z.array(z.lazy(() => CommentSchema)).optional(),
});

// New Post Schema for forum
const PostSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  content: z.string().min(10).max(10000).trim(),
  author: z.string(), // User ID
  flair: z.enum([
    "career-discussion",
    "interview-experience",
    "salary-details",
    "success-story",
    "question",
    "other",
  ]),
  upvotes: z.array(z.string()).optional(), // Array of user IDs who upvoted
  downvotes: z.array(z.string()).optional(), // Array of user IDs who downvoted
  comments: z.array(CommentSchema).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Update the UserSchema to include career path information
const UserSchema = z.object({
  username: z.string().min(3).trim(),
  gender: z.enum(["male", "female", "other", "prefer not to say"]),
  country: z.string().min(2).trim(),
  state: z.string().min(2).trim(),
  domain: z.enum(["web", "app", "blockchain", "other"]).optional(),
  otherDomain: z.string().optional(),
  skills: z.array(SkillSchema).optional(),
  skillScores: z.array(SkillScoreSchema).optional(),
  careerGuidance: z.string().max(50000).optional(), // New field for career guidance
  careerPathInfo: z
    .object({
      currentLevel: z.string().optional(),
      nextSteps: z.array(z.string()).optional(),
      recommendedRoles: z
        .array(
          z.object({
            title: z.string(),
            level: z.string().optional(),
            salary: z.string().optional(),
            demand: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  mailId: z.string().email().trim().toLowerCase(),
  // New fields for forum activity tracking
  posts: z.array(z.string()).optional(), // Array of post IDs created by the user
  upvotedPosts: z.array(z.string()).optional(), // Array of post IDs upvoted by the user
  downvotedPosts: z.array(z.string()).optional(), // Array of post IDs downvoted by the user
});

// Mongoose Schema
const mongooseUserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minLength: [3, "Username must be at least 3 characters long"],
      unique: true,
      index: true,
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["male", "female", "other", "prefer not to say"],
        message: "{VALUE} is not a valid gender option",
      },
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    domain: {
      type: String,
      required: false,
      enum: {
        values: ["web", "app", "blockchain", "other"],
        message: "{VALUE} is not a valid domain option",
      },
    },
    otherDomain: {
      type: String,
      required: function () {
        return this.domain === "other";
      },
      trim: true,
    },
    skills: {
      type: [String],
      required: false,
      trim: true,
    },
    skillScores: [
      {
        skill: {
          type: String,
          required: [true, "Skill is required"],
        },
        score: {
          type: Number,
          required: [true, "Score is required"],
          min: [0, "Score must be between 0 and 100"],
          max: [100, "Score must be between 0 and 100"],
        },
      },
    ],
    careerGuidance: {
      type: String,
      trim: true,
      maxLength: [50000, "Career guidance cannot exceed 50000 characters"],
    },
    mailId: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    careerPathInfo: {
      currentLevel: String,
      nextSteps: [String],
      recommendedRoles: [
        {
          title: String,
          level: String,
          salary: String,
          demand: String,
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
mongooseUserSchema.index({ username: 1, mailId: 1 });

// Pre-save middleware for Zod validation
mongooseUserSchema.pre("save", async function (next) {
  try {
    // Only validate if document is new or modified
    if (this.isNew || this.isModified()) {
      UserSchema.parse({
        username: this.username,
        gender: this.gender,
        country: this.country,
        state: this.state,
        domain: this.domain,
        otherDomain: this.otherDomain,
        skills: this.skills || [],
        skillScores: this.skillScores,
        careerGuidance: this.careerGuidance,
        mailId: this.mailId,
      });
    }
    next();
  } catch (error) {
    next(new Error(error.errors?.[0]?.message || "Validation failed"));
  }
});

// Pre-save middleware for otherDomain validation
mongooseUserSchema.pre("save", function (next) {
  if (this.domain === "other" && !this.otherDomain) {
    next(
      new Error('Other domain specification is required when domain is "other"')
    );
  }
  next();
});

// Error handling for duplicate key errors
mongooseUserSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    next(
      new Error(`${field === "username" ? "Username" : "Email"} already exists`)
    );
  } else {
    next(error);
  }
});

const FeedbackSchema = z.object({
  section: z.enum([
    "assessments",
    "resume-analysis",
    "interview",
    "career-guidance",
    "beginner-assessment",
    "other",
  ]),
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(), // For assessment feedback
});

// New Mongoose Feedback Schema
const mongooseFeedbackSchema = new Schema(
  {
    section: {
      type: String,
      required: [true, "Section is required"],
      enum: {
        values: [
          "assessments",
          "resume-analysis",
          "interview",
          "career-guidance",
          "beginner-assessment",
          "other",
        ],
        message: "{VALUE} is not a valid section option",
      },
    },
    stars: {
      type: Number,
      required: [true, "Star rating is required"],
      min: [1, "Rating must be between 1 and 5"],
      max: [5, "Rating must be between 1 and 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxLength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware for Zod validation
mongooseFeedbackSchema.pre("save", async function (next) {
  try {
    if (this.isNew || this.isModified()) {
      FeedbackSchema.parse({
        section: this.section,
        stars: this.stars,
        comment: this.comment,
      });
    }
    next();
  } catch (error) {
    next(new Error(error.errors?.[0]?.message || "Feedback validation failed"));
  }
});

// New Mongoose Schema for Comments
const mongooseCommentSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      minLength: [1, "Comment must not be empty"],
      maxLength: [2000, "Comment cannot exceed 2000 characters"],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment author is required"],
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add a pre-remove hook to handle cascading deletion of replies
mongooseCommentSchema.pre("remove", async function (next) {
  try {
    // Find all replies to this comment
    const replies = await this.model("Comment").find({
      parentCommentId: this._id,
    });

    // Remove each reply
    for (const reply of replies) {
      await reply.remove();
    }

    next();
  } catch (error) {
    next(error);
  }
});

// New Mongoose Schema for Posts
const mongoosePostSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      minLength: [3, "Title must be at least 3 characters long"],
      maxLength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      minLength: [10, "Content must be at least 10 characters long"],
      maxLength: [10000, "Content cannot exceed 10000 characters"],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Post author is required"],
    },
    flair: {
      type: String,
      required: [true, "Post flair is required"],
      enum: {
        values: [
          "career-discussion",
          "interview-experience",
          "salary-details",
          "success-story",
          "question",
          "other",
        ],
        message: "{VALUE} is not a valid flair option",
      },
    },
    upvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    downvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Update the User schema to include forum activity
mongooseUserSchema.add({
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  upvotedPosts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  downvotedPosts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
});

// Create or get existing models
let User;
let Feedback;
let Post;
let Comment;

try {
  User = mongoose.model("User");
} catch {
  User = mongoose.model("User", mongooseUserSchema);
}

try {
  Feedback = mongoose.model("Feedback");
} catch {
  Feedback = mongoose.model("Feedback", mongooseFeedbackSchema);
}

try {
  Post = mongoose.model("Post");
} catch {
  Post = mongoose.model("Post", mongoosePostSchema);
}

try {
  Comment = mongoose.model("Comment");
} catch {
  Comment = mongoose.model("Comment", mongooseCommentSchema);
}

module.exports = {
  schemas: {
    SkillSchema,
    UserSchema,
    SkillScoreSchema,
    FeedbackSchema,
    PostSchema,
    CommentSchema,
  },
  models: {
    User,
    Feedback,
    Post,
    Comment,
  },
};
