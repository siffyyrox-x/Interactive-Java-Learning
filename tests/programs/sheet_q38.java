class Main {
  public static void main(String[] args) {
    int a = 12, b = 5, c = 9;
    a -= b % 3 + c / 4;
    System.out.println(a);
    b += a++ - --c;
    System.out.println(a + " " + b + " " + c);
    c = a % b + b % a + c;
    System.out.println(c);
    System.out.println(a * b / c + a % c);
  }
}
