import { QuestionContext } from "./types";

export const MOCK_QUESTIONS: QuestionContext[] = [
  {
    id: "q1",
    title: "Quadratic Equation",
    description: "Solve the quadratic equation 2x^2 - 4x - 6 = 0 for x. Show step-by-step factorization or use of the quadratic formula.",
    totalMarks: 10
  },
  {
    id: "q2",
    title: "Calculus: Indefinite Integral",
    description: "Find the indefinite integral of f(x) = 3x^2 + 2x + 1. Remember to include the constant of integration.",
    totalMarks: 10
  },
  {
    id: "q3",
    title: "Physics: Kinematics",
    description: "A car accelerates from rest at 2 m/s^2 for 5 seconds. Calculate the final velocity and the distance traveled.",
    totalMarks: 15
  },
  {
    id: "q4",
    title: "Linear Algebra: Eigenvalues",
    description: "Find the eigenvalues of the matrix A = [[2, 1], [1, 2]].",
    totalMarks: 20
  }
];