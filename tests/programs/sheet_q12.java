class Main {
  public static void main(String[] args) {
    int mark = 73;
    int bonus = 5;
    if (mark + bonus >= 80) {
      System.out.println("A");
    } else if (mark >= 70 && bonus > 3) {
      System.out.println("B+");
    } else {
      System.out.println("B");
    }
    mark -= 10;
    if (mark % 2 == 1 || bonus % 2 == 0) {
      System.out.println(mark + bonus);
    } else {
      System.out.println(mark - bonus);
    }
  }
}
